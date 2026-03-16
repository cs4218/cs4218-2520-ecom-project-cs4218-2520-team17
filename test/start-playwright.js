import { spawn } from "node:child_process";
import process from "node:process";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { cleanupAndSeedDb } from "./utils.js";
import { fileURLToPath } from "node:url";
import path from "node:path";
import 'dotenv/config';
import { writeFileSync } from 'node:fs';

let mongod;
let backendProcess;
let frontendProcess;
let shuttingDown = false;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname);

async function seedDatabase(mongoUri) {
  await mongoose.connect(mongoUri);
  await cleanupAndSeedDb();
  await mongoose.disconnect();
}

function startChildProcess(command, args, env, name) {
  const child = spawn(`${command} ${args.join(" ")}`, {
    cwd: workspaceRoot,
    env,
    shell: true,
    stdio: "inherit",
  });

  child.on("exit", (code) => {
    if (!shuttingDown && code !== 0) {
      console.error(`${name} exited with code ${code}.`);
      void shutdown(1);
    }
  });

  return child;
}

async function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  const killProcess = (child) => {
    if (child && !child.killed) {
      child.kill("SIGTERM");
    }
  };

  killProcess(backendProcess);
  killProcess(frontendProcess);

  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch {
    // Ignore disconnect errors during shutdown.
  }

  if (mongod) {
    await mongod.stop();
  }

  process.exit(exitCode);
}

async function main() {
  mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri();

  process.env.MONGO_URL = mongoUri;
  writeFileSync('.mongo-test-uri', mongoUri);

  await seedDatabase(mongoUri);

  const backendEnv = {
    ...process.env,
    MONGO_URL: mongoUri,
  };

  // Use client/.env
  const frontendEnv = {
    ...process.env,
    PORT: "3000",   // Override the PORT inherited from process.env
    REACT_APP_API_URL: "http://localhost:6060",
    DANGEROUSLY_DISABLE_HOST_CHECK: "true",
    BROWSER: 'none',
  };

  backendProcess = startChildProcess("npm", ["run", "start"], backendEnv, "Backend server");
  frontendProcess = startChildProcess("npm", ["run", "client"], frontendEnv, "Frontend server");

  process.on("SIGINT", () => {
    void shutdown(0);
  });
  process.on("SIGTERM", () => {
    void shutdown(0);
  });
}

void main().catch((error) => {
  console.error("Failed to start Playwright in-memory harness:", error);
  void shutdown(1);
});
