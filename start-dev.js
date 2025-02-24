const { spawn } = require("child_process");
const os = require("os");

// Function to start a process
const startProcess = (command, args, cwd, env = {}) => {
  const proc = spawn(command, args, {
    cwd,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...env }, // Merge custom env vars
  });
  proc.on("exit", (code) => console.log(`${command} exited with code ${code}`));
};

// Platform detection
console.log("Platform: " + os.platform());
console.log("Arch: " + os.arch());
console.log("Release: " + os.release());
console.log("WSL: " + os.release().toLowerCase().includes("linux"));

const isWindows = os.platform() === "win32";
const isMacArm = os.platform() === "darwin" && os.arch() === "arm64";
const isWSL = os.release().toLowerCase().includes("linux");

// Paths
const backendPath = "./ShaderForge.API";
const frontendPath = "./shaderforge.ui";

// Start .NET backend
const dotnetCmd = isWindows ? "dotnet.exe" : "dotnet";
startProcess(dotnetCmd, ["watch", "run"], backendPath);

// Start Vue frontend with environment variables
const packageManager = isWindows || isWSL ? "yarn.cmd" : "yarn";

// Environment variables for frontend
const frontendEnv = {
  CHOKIDAR_USEPOLLING: "true",
  CHOKIDAR_INTERVAL: "300",
  VUE_APP_API_BASE_URL: "http://localhost:5220/api",
  NODE_ENV: "development"
};

// Start frontend
startProcess(
  packageManager,
  ["serve", "--debug", "--inspect"],
  frontendPath,
  frontendEnv
);
