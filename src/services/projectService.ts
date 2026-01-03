import { Command } from "@tauri-apps/plugin-shell";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Project } from "@/types";
import { getDefaultPortForFramework } from "@/utils/runtime";
import { toastError, toastWarning } from "@/utils/toast";
import { tauriApi } from "@/api/tauri";

export const scanProjects = async (path: string): Promise<Project[]> => {
  const foundProjects = await tauriApi.projects.scan(path);
  // Clear ports when scanning (they will be detected dynamically when executed)
  return foundProjects.map((p) => ({
    ...p,
    port: null,
  }));
};

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
    throw new Error("Runtime no soportado");
  }
};

export const detectPort = async (
  pid: number,
  attempts: number = 10,
  initialDelay: number = 1000,
  intervalDelay: number = 1500
): Promise<number | null> => {
  // Wait a moment before the first attempt
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

    // Wait before the next attempt (except the last one)
    if (i < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalDelay));
    }
  }

  return null;
};

export const openInBrowser = async (port: number | null): Promise<void> => {
  if (port) {
    try {
      await openUrl(`http://localhost:${port}`);
    } catch (error) {
      toastError("Error opening browser", String(error));
    }
  }
};

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

export const openProjectInBrowser = async (project: Project): Promise<void> => {
  // If port is already detected, use it directly
  if (project.port) {
    await openInBrowser(project.port);
    return;
  }

  // If no port, try to use the default port for the framework
  const defaultPort = getDefaultPortForFramework(project);
  if (defaultPort) {
    await openInBrowser(defaultPort);
    return;
  }

  // Fallback: show warning
  toastWarning(
    "Port not detected",
    "Unable to determine the server port. Please check if the server is running."
  );
};
