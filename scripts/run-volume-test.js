// Li Jiakai, A0252287Y

import process from "node:process";
import path from "node:path";
import { createWriteStream, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const workspaceRoot = process.cwd();
const reportsDir = path.join(workspaceRoot, "k6", "reports");
const composeFile = path.join(workspaceRoot, "docker-compose.volume.yml");
const seedScript = path.join(workspaceRoot, "scripts", "seed-volume-data.js");
const validateScript = path.join(workspaceRoot, "scripts", "validate-volume-data.js");
const mongoStatsPath = path.join(reportsDir, "mongo-stats.jsonl");

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const config = {
  mongoUrl:
    process.env.MONGO_URL ||
    "mongodb://root:rootpassword@localhost:27017/ecom_volume?authSource=admin",
  baseUrl: process.env.BASE_URL || "http://host.docker.internal:6060",
  userVus: process.env.USER_VUS || "100",
  dataGrowthVus: process.env.DATA_GROWTH_VUS || "4",
  rampUp: process.env.RAMP_UP || "5m",
  steadyDuration: process.env.STEADY_DURATION || "30m",
  rampDown: process.env.RAMP_DOWN || "5m",
  dataGrowthDuration: process.env.DATA_GROWTH_DURATION || "40m",
  seedCategories: process.env.VOLUME_SEED_CATEGORIES || "100",
  seedUsers: process.env.VOLUME_SEED_USERS || "5000",
  seedAdmins: process.env.VOLUME_SEED_ADMINS || "5",
  seedProducts: process.env.VOLUME_SEED_PRODUCTS || "10000",
  seedOrders: process.env.VOLUME_SEED_ORDERS || "10000",
  includePayment: process.env.INCLUDE_PAYMENT || "true",
  enableK6Dashboard: (process.env.K6_WEB_DASHBOARD || "true").toLowerCase() === "true",
  k6DashboardHost: process.env.K6_WEB_DASHBOARD_HOST || "0.0.0.0",
  k6DashboardPort: process.env.K6_WEB_DASHBOARD_PORT || "5665",
  k6DashboardPeriod: process.env.K6_WEB_DASHBOARD_PERIOD || "2s",
  k6DashboardExport: process.env.K6_WEB_DASHBOARD_EXPORT || "/work/k6/reports/html-report.html",
  maxDistinctProducts: process.env.VOLUME_MAX_DISTINCT_PRODUCTS || "20",
  maxProductQty: process.env.VOLUME_MAX_PRODUCT_QTY || "10",
  keepMongo: (process.env.VOLUME_KEEP_MONGO || "true").toLowerCase() === "true",
  keepK6: (process.env.VOLUME_KEEP_K6 || "true").toLowerCase() === "true",
};

function commandDisplay(command, args) {
  return `${command} ${args.join(" ")}`;
}

function runCommand(command, args, options = {}) {
  const {
    cwd = workspaceRoot,
    env = process.env,
    capture = false,
    allowFailure = false,
  } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      shell: false,
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    });

    let stdout = "";
    let stderr = "";

    if (capture) {
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0 || allowFailure) {
        resolve({ code, stdout, stderr });
        return;
      }

      reject(
        new Error(
          `Command failed (${code}): ${commandDisplay(command, args)}${
            stderr ? `\n${stderr}` : ""
          }`
        )
      );
    });
  });
}

async function waitForMongoHealthy(containerName, timeoutMs = 180000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const health = await runCommand(
      "docker",
      ["inspect", "-f", "{{.State.Health.Status}}", containerName],
      { capture: true, allowFailure: true }
    );

    const status = health.stdout.trim();
    if (health.code === 0 && status === "healthy") {
      return;
    }

    await delay(2000);
  }

  throw new Error(`Mongo container ${containerName} did not become healthy in time`);
}

async function waitForApi(url, timeoutMs = 180000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { method: "GET" });
      if (response.status >= 200 && response.status < 500) {
        return;
      }
    } catch {
      // Continue polling.
    }

    await delay(1500);
  }

  throw new Error(`API did not become reachable in time: ${url}`);
}

function startMongoMonitor(containerName, outputFile, intervalMs = 5000) {
  const stream = createWriteStream(outputFile, { flags: "w" });
  let running = false;

  async function collect() {
    if (running) return;
    running = true;

    try {
      const result = await runCommand(
        "docker",
        ["stats", "--no-stream", "--format", "{{json .}}", containerName],
        { capture: true, allowFailure: true }
      );

      const raw = result.stdout.trim();
      if (result.code === 0 && raw) {
        stream.write(
          `${JSON.stringify({ ts: new Date().toISOString(), stats: JSON.parse(raw) })}\n`
        );
      } else {
        stream.write(
          `${JSON.stringify({
            ts: new Date().toISOString(),
            error: result.stderr.trim() || "Unable to read docker stats",
          })}\n`
        );
      }
    } catch (error) {
      stream.write(
        `${JSON.stringify({ ts: new Date().toISOString(), error: String(error) })}\n`
      );
    } finally {
      running = false;
    }
  }

  const timer = setInterval(() => {
    void collect();
  }, intervalMs);

  void collect();

  return async () => {
    clearInterval(timer);
    await delay(200);
    stream.end();
  };
}

async function stopProcessTree(child) {
  if (!child || child.killed) {
    return;
  }

  if (process.platform === "win32") {
    await runCommand("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      allowFailure: true,
      capture: true,
    });
    return;
  }

  child.kill("SIGTERM");
}

function removeOldArtifacts() {
  mkdirSync(reportsDir, { recursive: true });
  const files = [
    "k6-results.json",
    "k6-summary.json",
    "k6-summary-runtime.json",
    "mongo-stats.jsonl",
  ];

  for (const file of files) {
    rmSync(path.join(reportsDir, file), { force: true });
  }
}

async function main() {
  let backendProcess;
  let stopMongoMonitor;

  removeOldArtifacts();
  writeFileSync(
    path.join(reportsDir, "volume-run-config.json"),
    JSON.stringify(config, null, 2)
  );

  try {
    console.log("[volume] starting MongoDB container");
    await runCommand("docker", ["compose", "-f", composeFile, "up", "-d"]);
    await waitForMongoHealthy("ecom-mongo-volume");

    const seededEnv = {
      ...process.env,
      MONGO_URL: config.mongoUrl,
      VOLUME_SEED_CATEGORIES: config.seedCategories,
      VOLUME_SEED_USERS: config.seedUsers,
      VOLUME_SEED_ADMINS: config.seedAdmins,
      VOLUME_SEED_PRODUCTS: config.seedProducts,
      VOLUME_SEED_ORDERS: config.seedOrders,
      VOLUME_MAX_DISTINCT_PRODUCTS: config.maxDistinctProducts,
      VOLUME_MAX_PRODUCT_QTY: config.maxProductQty,
      VOLUME_TEST_PASSWORD: process.env.VOLUME_TEST_PASSWORD || "VolumeTest!123",
      VOLUME_SEED_RESET: process.env.VOLUME_SEED_RESET || "true",
    };

    console.log("[volume] seeding data");
    await runCommand(process.execPath, [seedScript], { env: seededEnv });

    console.log("[volume] validating seeded dataset");
    await runCommand(process.execPath, [validateScript], { env: seededEnv });

    console.log("[volume] waiting for backend to be ready");
    // backendProcess = spawn(npmCommand, ["run", "start"], {
    //   cwd: workspaceRoot,
    //   env: {
    //     ...process.env,
    //     MONGO_URL: config.mongoUrl,
    //     NODE_ENV: "production",
    //     PORT: "6060",
    //   },
    //   shell: false,
    //   stdio: "inherit",
    // });

    await waitForApi("http://localhost:6060/api/v1/category/get-category");

    console.log("[volume] collecting MongoDB container metrics");
    stopMongoMonitor = startMongoMonitor("ecom-mongo-volume", mongoStatsPath, 5000);

    console.log("[volume] running k6 volume test with dual scenarios");
    const dockerArgs = ["run"];
    if (!config.keepK6) {
      dockerArgs.push("--rm");
    }

    dockerArgs.push(
      "-i",
      "-p",
      `${config.k6DashboardPort}:${config.k6DashboardPort}`,
      "-v",
      `${workspaceRoot}:/work`,
      "-w",
      "/work",
      "-e",
      `BASE_URL=${config.baseUrl}`,
      "-e",
      `USER_VUS=${config.userVus}`,
      "-e",
      `DATA_GROWTH_VUS=${config.dataGrowthVus}`,
      "-e",
      `RAMP_UP=${config.rampUp}`,
      "-e",
      `STEADY_DURATION=${config.steadyDuration}`,
      "-e",
      `RAMP_DOWN=${config.rampDown}`,
      "-e",
      `DATA_GROWTH_DURATION=${config.dataGrowthDuration}`,
      "-e",
      `VOLUME_SEED_USERS=${config.seedUsers}`,
      "-e",
      `VOLUME_MAX_DISTINCT_PRODUCTS=${config.maxDistinctProducts}`,
      "-e",
      `VOLUME_MAX_PRODUCT_QTY=${config.maxProductQty}`,
      "-e",
      `VOLUME_TEST_PASSWORD=${process.env.VOLUME_TEST_PASSWORD || "VolumeTest!123"}`,
      "-e",
      `INCLUDE_PAYMENT=${config.includePayment}`,
      "-e",
      `K6_WEB_DASHBOARD=${String(config.enableK6Dashboard)}`,
      "-e",
      `K6_WEB_DASHBOARD_HOST=${config.k6DashboardHost}`,
      "-e",
      `K6_WEB_DASHBOARD_PORT=${config.k6DashboardPort}`,
      "-e",
      `K6_WEB_DASHBOARD_PERIOD=${config.k6DashboardPeriod}`,
      "-e",
      `K6_WEB_DASHBOARD_EXPORT=${config.k6DashboardExport}`
    );

    if (process.platform === "linux") {
      dockerArgs.push("--add-host", "host.docker.internal:host-gateway");
    }

    if (config.enableK6Dashboard) {
      console.log(
        `[volume] k6 dashboard expected at http://localhost:${config.k6DashboardPort}`
      );
    }

    dockerArgs.push(
      "grafana/k6:1.7.1",
      "run",
      "/work/k6/scenarios/volume-test.js",
      "--summary-export=/work/k6/reports/k6-summary.json",
      "--out",
      "json=/work/k6/reports/k6-results.json",
    );

    await runCommand("docker", dockerArgs);

    if (stopMongoMonitor) {
      await stopMongoMonitor();
      stopMongoMonitor = undefined;
    }

    console.log("[volume] completed. raw outputs in k6/reports:");
    console.log("[volume] - k6-summary.json");
    console.log("[volume] - k6-results.json");
    if (config.enableK6Dashboard) {
      console.log(
        `[volume] dashboard was available live at http://localhost:${config.k6DashboardPort}`
      );
    }
  } finally {
    if (stopMongoMonitor) {
      await stopMongoMonitor();
    }

    await stopProcessTree(backendProcess);

    if (!config.keepMongo) {
      console.log("[volume] stopping MongoDB container");
      await runCommand(
        "docker",
        ["compose", "-f", composeFile, "down"],
        { allowFailure: true }
      );
    }
  }
}

main().catch((error) => {
  console.error("[volume] run failed", error);
  process.exit(1);
});
