import { useState, useCallback } from "react";
import { Child } from "@tauri-apps/plugin-shell";
import { invoke } from "@tauri-apps/api/core";
import { Project, LogEntry } from "../types";
import {
  scanProjects,
  createProjectCommand,
  detectPort,
  killProcessByPort,
} from "../services/projectService";
import { toastError } from "../utils/toast";

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

  const loadProjects = async (path: string) => {
    setLoading(true);
    try {
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
      const command = createProjectCommand(project);
      addLog(
        project.path,
        "stdout",
        `[${new Date().toLocaleTimeString()}] Starting ${project.name}...\n`
      );

      const child = await command.spawn();

      addLog(
        project.path,
        "stdout",
        `[${new Date().toLocaleTimeString()}] Process started (PID: ${child.pid || "unknown"})\n`
      );

      // Note: Tauri shell plugin v2 doesn't expose stdout/stderr streams directly
      // We'll add basic log entries for process lifecycle events
      // Full stdout/stderr capture would require a different approach or Tauri plugin update

      setProcesses((prev) => {
        const newMap = new Map(prev);
        newMap.set(project.path, child);
        return newMap;
      });

      // Detect the real port after the server starts
      if (child.pid) {
        // Iniciar la detección en background
        detectPort(child.pid).then((detectedPort) => {
          // Verificar que el proyecto aún esté corriendo
          setRunningProjects((current) => {
            if (current.has(project.path) && detectedPort) {
              // Update the port in the project
              setProjects((prev) =>
                prev.map((p) =>
                  p.path === project.path ? { ...p, port: detectedPort } : p
                )
              );
            }
            return current;
          });
        });
      }
    } catch (error) {
      addLog(project.path, "stderr", `Error running project: ${error}`);
      toastError("Error running project", String(error));
      setRunningProjects((prev) => {
        const newSet = new Set(prev);
        newSet.delete(project.path);
        return newSet;
      });
    }
  };

  const stopProject = async (project: Project) => {
    const process = processes.get(project.path);

    if (process) {
      try {
        // Try to kill using the PID if available
        if (process.pid) {
          try {
            await invoke("kill_process_tree", { pid: process.pid });
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
