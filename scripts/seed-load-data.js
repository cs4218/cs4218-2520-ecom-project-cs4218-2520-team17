import { spawn } from "child_process";

// Set environment variables and run the seed script
process.env.VOLUME_SEED_PRODUCTS = "1000";
process.env.VOLUME_SEED_USERS = "500";

const child = spawn("node", ["./scripts/seed-volume-data.js"], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code);
});