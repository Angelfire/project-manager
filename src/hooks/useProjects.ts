import { useState, useCallback, useEffect } from "react";
import { Child } from "@tauri-apps/plugin-shell";
import { listen } from "@tauri-apps/api/event";
import { Project, LogEntry } from "@/types";
import {
  scanProjects,
  createProjectCommand,
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
  const [processes, setProcesses] = useState<Map<string, Child>>(new Map());
  const [logs, setLogs] = useState<Map<string, LogEntry[]>>(new Map());
  const [rustProcessPids, setRustProcessPids] = useState<Map<string, number>>(
    new Map()
  );

  // Listen to process stdout/stderr events from Rust backend
  useEffect(() => {
    let unlistenStdout: (() => void) | null = null;
    let unlistenStderr: (() => void) | null = null;
    let unlistenExit: (() => void) | null = null;

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
    };

    setupEventListeners();

    return () => {
      if (unlistenStdout) unlistenStdout();
      if (unlistenStderr) unlistenStderr();
      if (unlistenExit) unlistenExit();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      // Also create a Child object for compatibility with existing code
      const commandObj = createProjectCommand(project);
      const child = await commandObj.spawn();

      setProcesses((prev) => {
        const newMap = new Map(prev);
        newMap.set(project.path, child);
        return newMap;
      });

      // Detect the real port after the server starts
      if (pid) {
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
      }
    } catch (error) {
      addLog(
        project.path,
        "stderr",
        `[${new Date().toLocaleTimeString()}] Failed to start project\n`
      );
      addLog(
        project.path,
        "stderr",
        `[${new Date().toLocaleTimeString()}] Error: ${error instanceof Error ? error.message : String(error)}\n`
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
    // Try to kill using Rust process PID first (if available)
    const rustPid = rustProcessPids.get(project.path);
    if (rustPid) {
      try {
        await tauriApi.processes.killTree(rustPid);
      } catch {
        // Ignore kill errors
      }
    }

    // Also try to kill using the Child process
    const process = processes.get(project.path);
    if (process) {
      try {
        // Try to kill using the PID if available
        if (process.pid) {
          try {
            await tauriApi.processes.killTree(process.pid);
          } catch {
            // Try to kill the process directly as fallback
            try {
              await process.kill();
            } catch {
              // Ignore kill errors
            }
          }
        } else {
          // If no PID, try to kill directly
          try {
            await process.kill();
          } catch {
            // Ignore kill errors
          }
        }
      } catch {
        // Ignore errors during process termination
      }
    } else {
      // If we don't find the process in the map, try to kill by port
      if (project.port) {
        await killProcessByPort(project.port);
      }
    }

    // Clean up Rust process PID
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

    setProcesses((prev) => {
      const newMap = new Map(prev);
      newMap.delete(project.path);
      return newMap;
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
    processes,
    logs,
    loadProjects,
    runProject,
    stopProject,
    getProjectLogs,
    clearProjectLogs,
  };
};
