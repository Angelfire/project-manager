import { useState, useCallback, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { Project, LogEntry } from "@/types";
import {
  scanProjects,
  detectPort,
  killProcessByPort,
} from "@/services/projectService";
import { toastError } from "@/utils/toast";
import { tauriApi } from "@/api/tauri";
import { validateDirectoryPath } from "@/utils/validation";

export const useProjects = () => {
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(
    null
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningProjects, setRunningProjects] = useState<Set<string>>(
    new Set()
  );
  const [logs, setLogs] = useState<Map<string, LogEntry[]>>(new Map());
  const [rustProcessPids, setRustProcessPids] = useState<Map<string, number>>(
    new Map()
  );

  const addLog = useCallback(
    (projectPath: string, type: "stdout" | "stderr", content: string) => {
      const logEntry: LogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        type,
        content,
        projectPath,
      };

      setLogs((prev) => {
        const newMap = new Map(prev);
        const projectLogs = newMap.get(projectPath) || [];
        // Keep only the last 1000 log entries per project
        const updatedLogs = [...projectLogs, logEntry].slice(-1000);
        newMap.set(projectPath, updatedLogs);
        return newMap;
      });
    },
    []
  );

  // Listen to process stdout/stderr events from Rust backend
  useEffect(() => {
    let unlistenStdout: (() => void) | null = null;
    let unlistenStderr: (() => void) | null = null;
    let unlistenExit: (() => void) | null = null;
    let unlistenExitError: (() => void) | null = null;

    const setupEventListeners = async () => {
      unlistenStdout = await listen<{
        projectPath: string;
        content: string;
      }>("process-stdout", (event) => {
        addLog(
          event.payload.projectPath,
          "stdout",
          event.payload.content + "\n"
        );
      });

      unlistenStderr = await listen<{
        projectPath: string;
        content: string;
      }>("process-stderr", (event) => {
        addLog(
          event.payload.projectPath,
          "stderr",
          event.payload.content + "\n"
        );
      });

      unlistenExit = await listen<{
        projectPath: string;
        pid: number;
      }>("process-exit", (event) => {
        addLog(
          event.payload.projectPath,
          "stdout",
          `[${new Date().toLocaleTimeString()}] Process exited (PID: ${event.payload.pid})\n`
        );
        setRunningProjects((prev) => {
          const newSet = new Set(prev);
          newSet.delete(event.payload.projectPath);
          return newSet;
        });
        setRustProcessPids((prev) => {
          const newMap = new Map(prev);
          newMap.delete(event.payload.projectPath);
          return newMap;
        });
      });

      unlistenExitError = await listen<{
        projectPath: string;
        pid: number;
        error: string;
      }>("process-exit-error", (event) => {
        addLog(
          event.payload.projectPath,
          "stderr",
          `[${new Date().toLocaleTimeString()}] Process wait error (PID: ${event.payload.pid}): ${event.payload.error}\n`
        );
        setRunningProjects((prev) => {
          const newSet = new Set(prev);
          newSet.delete(event.payload.projectPath);
          return newSet;
        });
        setRustProcessPids((prev) => {
          const newMap = new Map(prev);
          newMap.delete(event.payload.projectPath);
          return newMap;
        });
      });
    };

    const setupPromise = setupEventListeners();

    return () => {
      setupPromise
        .then(() => {
          if (unlistenStdout) unlistenStdout();
          if (unlistenStderr) unlistenStderr();
          if (unlistenExit) unlistenExit();
          if (unlistenExitError) unlistenExitError();
        })
        .catch(() => {
          // Optionally handle or log setup errors; ignore here to avoid unmount-time noise
        });
    };
  }, [addLog]);

  const loadProjects = async (path: string) => {
    setLoading(true);
    try {
      // Validate path before processing (includes existence check)
      await validateDirectoryPath(path);

      const foundProjects = await scanProjects(path);
      setProjects(foundProjects);
    } catch (error) {
      toastError("Error scanning directory", String(error));
    } finally {
      setLoading(false);
    }
  };

  const runProject = async (project: Project) => {
    if (runningProjects.has(project.path)) {
      return;
    }

    setRunningProjects((prev) => new Set(prev).add(project.path));
    // Clear previous logs when starting a new run
    setLogs((prev) => {
      const newMap = new Map(prev);
      newMap.set(project.path, []);
      return newMap;
    });

    try {
      // Determine command and args based on project
      let command: string;
      let args: string[];

      if (project.runtime === "Node.js") {
        const packageManager = project.package_manager || "npm";
        command = packageManager;
        args = packageManager === "npm" ? ["run", "dev"] : ["dev"];
      } else if (project.runtime === "Deno") {
        command = "deno";
        args = ["task", "dev"];
      } else if (project.runtime === "Bun") {
        command = "bun";
        args = ["run", "dev"];
      } else {
        throw new Error(`Unsupported runtime: ${project.runtime}`);
      }

      // Use Rust command to spawn with log capture
      const pid = await tauriApi.processes.spawnWithLogs(
        command,
        args,
        project.path,
        project.path
      );

      setRustProcessPids((prev) => {
        const newMap = new Map(prev);
        newMap.set(project.path, pid);
        return newMap;
      });

      addLog(
        project.path,
        "stdout",
        `[${new Date().toLocaleTimeString()}] Process started (PID: ${pid})\n`
      );

      // Start port detection in background
      detectPort(pid)
        .then((detectedPort) => {
          // Verify that the project is still running
          setRunningProjects((current) => {
            if (current.has(project.path) && detectedPort) {
              // Update the port in the project
              setProjects((prev) =>
                prev.map((p) =>
                  p.path === project.path ? { ...p, port: detectedPort } : p
                )
              );
              // Log port detection
              addLog(
                project.path,
                "stdout",
                `[${new Date().toLocaleTimeString()}] Server detected on port ${detectedPort}\n`
              );
            }
            return current;
          });
        })
        .catch((_error) => {
          // Port detection failure is non-critical, log it but don't fail
          addLog(
            project.path,
            "stdout",
            `[${new Date().toLocaleTimeString()}] Port detection: Unable to detect port (this is normal for some projects)\n`
          );
        });
    } catch (error) {
      addLog(
        project.path,
        "stderr",
        `[${new Date().toLocaleTimeString()}] Failed to start project\n`
      );
      addLog(
        project.path,
        "stderr",
        `[${new Date().toLocaleTimeString()}] ${error instanceof Error ? error.message : String(error)}\n`
      );
      toastError("Error running project", String(error));
      setRunningProjects((prev) => {
        const newSet = new Set(prev);
        newSet.delete(project.path);
        return newSet;
      });
    }
  };

  const stopProject = async (project: Project) => {
    // Kill using Rust process PID (primary approach)
    const rustPid = rustProcessPids.get(project.path);
    if (rustPid) {
      try {
        await tauriApi.processes.killTree(rustPid);
      } catch {
        // Ignore kill errors
      }
    } else if (project.port) {
      // Fallback: if we don't have a PID, try to kill by port
      await killProcessByPort(project.port);
    }

    // Clean up Rust process PID
    // Note: There's potential redundancy between this cleanup and the process-exit event handler.
    // Both may attempt to clean up rustProcessPids and runningProjects if stopProject is called
    // while the process exits naturally. This is intentional for robustness - Map/Set deletions
    // are idempotent, so duplicate cleanup is harmless.
    setRustProcessPids((prev) => {
      const newMap = new Map(prev);
      newMap.delete(project.path);
      return newMap;
    });

    // Clean up state after trying to kill the process
    setRunningProjects((prev) => {
      const newSet = new Set(prev);
      newSet.delete(project.path);
      return newSet;
    });

    // Clear the port when the project is stopped
    setProjects((prev) =>
      prev.map((p) => (p.path === project.path ? { ...p, port: null } : p))
    );
  };

  const getProjectLogs = useCallback(
    (projectPath: string): LogEntry[] => {
      return logs.get(projectPath) || [];
    },
    [logs]
  );

  const clearProjectLogs = useCallback((projectPath: string) => {
    setLogs((prev) => {
      const newMap = new Map(prev);
      newMap.set(projectPath, []);
      return newMap;
    });
  }, []);

  return {
    selectedDirectory,
    setSelectedDirectory,
    projects,
    setProjects,
    loading,
    runningProjects,
    logs,
    loadProjects,
    runProject,
    stopProject,
    getProjectLogs,
    clearProjectLogs,
  };
};
