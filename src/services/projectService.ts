import { Command } from "@tauri-apps/plugin-shell";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Project } from "@/types";
import { toastError, toastWarning } from "@/utils/toast";
import { tauriApi } from "@/api/tauri";

/**
 * Scans a directory for projects and returns a list of detected projects.
 *
 * Scans a directory for projects and returns a list of detected projects.
 *
 * @param path - Directory path to scan
 * @returns Array of detected projects with ports cleared
 */
export const scanProjects = async (path: string): Promise<Project[]> => {
  const foundProjects = await tauriApi.projects.scan(path);
  // Clear ports when scanning (they will be detected dynamically when executed)
  return foundProjects.map((p) => ({
    ...p,
    port: null,
  }));
};

/**
 * Creates a Tauri Command object for running a project based on its runtime.
 *
 * @param project - Project object containing runtime and package manager info
 * @returns Configured Command object
 * @throws Error if runtime is not supported
 */
export const createProjectCommand = (project: Project) => {
  if (project.runtime === "Node.js") {
    const packageManager = project.package_manager || "npm";

    if (packageManager === "npm") {
      return Command.create("npm", ["run", "dev"], {
        cwd: project.path,
      });
    } else if (packageManager === "yarn") {
      return Command.create("yarn", ["dev"], {
        cwd: project.path,
      });
    } else if (packageManager === "pnpm") {
      return Command.create("pnpm", ["dev"], {
        cwd: project.path,
      });
    } else {
      return Command.create("bun", ["run", "dev"], {
        cwd: project.path,
      });
    }
  } else if (project.runtime === "Deno") {
    return Command.create("deno", ["task", "dev"], {
      cwd: project.path,
    });
  } else if (project.runtime === "Bun") {
    return Command.create("bun", ["run", "dev"], {
      cwd: project.path,
    });
  } else {
    throw new Error(`Unsupported runtime: ${project.runtime}`);
  }
};

/**
 * Detects the port number for a running process by PID.
 * Retries multiple times with configurable delays.
 *
 * @param pid - Process ID to detect port for
 * @param attempts - Number of detection attempts (default: 10)
 * @param initialDelay - Initial delay before first attempt in ms (default: 1000)
 * @param intervalDelay - Delay between attempts in ms (default: 1500)
 * @returns Detected port number or null if not found
 */
export const detectPort = async (
  pid: number,
  attempts: number = 15,
  initialDelay: number = 500,
  intervalDelay: number = 800
): Promise<number | null> => {
  // Reduced initial delay for faster detection
  await new Promise((resolve) => setTimeout(resolve, initialDelay));

  for (let i = 0; i < attempts; i++) {
    try {
      const detectedPort = await tauriApi.processes.detectPort(pid);

      if (detectedPort) {
        return detectedPort;
      }
    } catch {
      // Ignore port detection errors, will retry
    }

    // Reduced interval delay for faster detection
    // Wait before the next attempt (except the last one)
    if (i < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalDelay));
    }
  }

  return null;
};

/**
 * Opens a URL in the default browser for a given port.
 *
 * @param port - Port number to open (opens http://localhost:{port})
 */
export const openInBrowser = async (port: number | null): Promise<void> => {
  if (port) {
    try {
      await openUrl(`http://localhost:${port}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toastError(
        "Failed to open in browser",
        errorMessage.includes("not found") ||
          errorMessage.includes("No application")
          ? "No default browser found. Please configure your default browser."
          : `Unable to open browser: ${errorMessage}`
      );
    }
  }
};

/**
 * Kills all processes using a specific port.
 *
 * @param port - Port number to free
 */
export const killProcessByPort = async (port: number): Promise<void> => {
  try {
    const killPortCommand = Command.create("lsof", ["-ti", `:${port}`]);
    const portProcess = await killPortCommand.execute();
    if (portProcess.stdout) {
      const pid = parseInt(portProcess.stdout.trim());
      if (!isNaN(pid)) {
        await tauriApi.processes.killTree(pid);
      }
    }
  } catch {
    // Ignore errors when killing by port
  }
};

/**
 * Opens a project in the browser using its detected port or default port.
 * Falls back to default port for the framework if no port is detected.
 *
 * @param project - Project object to open in browser
 * @param runningPid - Optional PID of the running process to detect port if not available
 */
export const openProjectInBrowser = async (
  project: Project,
  runningPid?: number
): Promise<void> => {
  // If port is already detected, use it directly
  if (project.port) {
    await openInBrowser(project.port);
    return;
  }

  // If no port but we have a PID, try to detect it first
  if (!project.port && runningPid) {
    const detectedPort = await detectPort(runningPid, 5, 200, 300);
    if (detectedPort) {
      await openInBrowser(detectedPort);
      return;
    }
  }

  // If no port detected, show warning instead of using default port
  // Using default port can lead to opening wrong port (e.g., 4321 when server is on 4326)
  toastWarning(
    "Port not detected",
    "The server port has not been detected yet. Please wait a moment and try again, or check the project logs to see which port the server is using."
  );
};
