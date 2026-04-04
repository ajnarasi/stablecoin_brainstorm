/**
 * Start all x402 services in parallel
 *
 * Usage: node scripts/start-services.js
 *
 * Starts: gateway (8002), verifier (8003), settler (8004)
 */

const { spawn } = require("child_process");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const services = [
  { name: "Gateway",  dir: "gateway",  color: "\x1b[36m" },
  { name: "Verifier", dir: "verifier", color: "\x1b[35m" },
  { name: "Settler",  dir: "settler",  color: "\x1b[33m" },
];

const RESET = "\x1b[0m";

console.log("\n  Starting x402 services...\n");

const children = services.map(({ name, dir, color }) => {
  const cwd = path.join(ROOT, dir);
  const child = spawn("node", ["src/index.js"], {
    cwd,
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const prefix = `${color}[${name}]${RESET}`;

  child.stdout.on("data", (data) => {
    data.toString().split("\n").filter(Boolean).forEach((line) => {
      console.log(`${prefix} ${line}`);
    });
  });

  child.stderr.on("data", (data) => {
    data.toString().split("\n").filter(Boolean).forEach((line) => {
      console.error(`${prefix} ${line}`);
    });
  });

  child.on("exit", (code) => {
    console.log(`${prefix} exited with code ${code}`);
  });

  return child;
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n  Shutting down services...");
  children.forEach((child) => child.kill("SIGTERM"));
  setTimeout(() => process.exit(0), 2000);
});

process.on("SIGTERM", () => {
  children.forEach((child) => child.kill("SIGTERM"));
  setTimeout(() => process.exit(0), 2000);
});
