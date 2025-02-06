const { spawn } = require("child_process");
const os = require("os");

// Function to start a process
const startProcess = (command, args, cwd) => {
  const process = spawn(command, args, { cwd, stdio: "inherit", shell: true });
  process.on("exit", (code) => console.log(`${command} exited with code ${code}`));
};

// Detect OS and architecture
const isWindows = os.platform() === "win32";
const isMacArm = os.platform() === "darwin" && os.arch() === "arm64";
const isWSL = os.release().toLowerCase().includes("microsoft");

// Paths
const backendPath = "./ShaderForge.API";
const frontendPath = "./shaderforge.ui";

// Start .NET backend
const dotnetCmd = isWindows ? "dotnet.exe" : "dotnet";
startProcess(dotnetCmd, ["watch", "run"], backendPath);

// Start Vue frontend
const packageManager = isWindows || isWSL ? "yarn.cmd" : "yarn";
startProcess(packageManager, ["serve", "--debug", "--inspect"], frontendPath);
