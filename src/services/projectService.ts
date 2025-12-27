import { Command } from "@tauri-apps/plugin-shell";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Project } from "../types";
import { getDefaultPortForFramework } from "../utils/runtime";

export const scanProjects = async (path: string): Promise<Project[]> => {
  const foundProjects = await invoke<Project[]>("scan_directory", { path });
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
  // Esperar un poco antes del primer intento
  await new Promise((resolve) => setTimeout(resolve, initialDelay));

  for (let i = 0; i < attempts; i++) {
    try {
      const detectedPort = await invoke<number | null>("detect_port_by_pid", {
        pid,
      });

      if (detectedPort) {
        console.log(`✅ Detected port ${detectedPort} (attempt ${i + 1})`);
        return detectedPort;
      } else {
        console.log(`⏳ Port not detected yet (attempt ${i + 1}/${attempts})`);
      }
    } catch (error) {
      console.error(`❌ Error detecting port (attempt ${i + 1}/${attempts}):`, error);
    }

    // Esperar antes del siguiente intento (excepto en el último)
    if (i < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalDelay));
    }
  }

  console.warn(`⚠️ Could not detect port after ${attempts} attempts`);
  return null;
};

export const openInBrowser = async (port: number | null): Promise<void> => {
  if (port) {
    try {
      await openUrl(`http://localhost:${port}`);
    } catch (error) {
      console.error("Error opening browser:", error);
      alert("Error opening browser: " + error);
    }
  }
};

export const killProcessByPort = async (port: number): Promise<void> => {
  try {
    console.log(`🔍 Looking for process on port: ${port}`);
    const killPortCommand = Command.create("lsof", ["-ti", `:${port}`]);
    const portProcess = await killPortCommand.execute();
    if (portProcess.stdout) {
      const pid = parseInt(portProcess.stdout.trim());
      if (!isNaN(pid)) {
        console.log(`🔪 Killing process on port ${port} (PID: ${pid})`);
        await invoke("kill_process_tree", { pid });
      }
    }
  } catch (portError) {
    console.error("❌ Error killing by port:", portError);
  }
};

export const openProjectInBrowser = async (
  project: Project,
  processes: Map<string, any>
): Promise<void> => {
  // Wait a moment if the port hasn't been detected yet
  if (!project.port) {
    // Try to detect the port one more time before using the fallback
    const process = processes.get(project.path);
    if (process?.pid) {
      try {
        const detectedPort = await invoke<number | null>("detect_port_by_pid", {
          pid: process.pid,
        });
        if (detectedPort) {
          await openInBrowser(detectedPort);
          return;
        }
      } catch (error) {
        console.error("Error detecting port:", error);
      }
    }
    // If not detected, use the default port
    const defaultPort = getDefaultPortForFramework(project);
    if (defaultPort) {
      await openInBrowser(defaultPort);
    } else {
      alert("Port not available. The server may be starting...");
    }
  } else {
    // Use the detected port
    await openInBrowser(project.port);
  }
};

