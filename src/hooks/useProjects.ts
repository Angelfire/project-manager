import { useState } from "react";
import { Child } from "@tauri-apps/plugin-shell";
import { invoke } from "@tauri-apps/api/core";
import { Project } from "../types";
import {
  scanProjects,
  createProjectCommand,
  detectPort,
  killProcessByPort,
} from "../services/projectService";

export const useProjects = () => {
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningProjects, setRunningProjects] = useState<Set<string>>(new Set());
  const [processes, setProcesses] = useState<Map<string, Child>>(new Map());

  const loadProjects = async (path: string) => {
    setLoading(true);
    try {
      const foundProjects = await scanProjects(path);
      setProjects(foundProjects);
    } catch (error) {
      console.error("Error scanning directory:", error);
      alert("Error scanning directory: " + error);
    } finally {
      setLoading(false);
    }
  };

  const runProject = async (project: Project) => {
    if (runningProjects.has(project.path)) {
      return;
    }

    setRunningProjects((prev) => new Set(prev).add(project.path));

    try {
      const command = createProjectCommand(project);
      const child = await command.spawn();

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
      console.error("Error running project:", error);
      alert("Error running project: " + error);
      setRunningProjects((prev) => {
        const newSet = new Set(prev);
        newSet.delete(project.path);
        return newSet;
      });
    }
  };

  const stopProject = async (project: Project) => {
    console.log(`🛑 Stopping project: ${project.name} (${project.path})`);
    const process = processes.get(project.path);

    if (process) {
      try {
        // Try to kill using the PID if available
        if (process.pid) {
          console.log(`🔪 Killing process tree for PID: ${process.pid}`);
          try {
            await invoke("kill_process_tree", { pid: process.pid });
            console.log(
              `✅ Successfully killed process tree for PID: ${process.pid}`
            );
          } catch (error) {
            console.error("❌ Error killing process tree:", error);
            // Try to kill the process directly as fallback
            try {
              console.log(`🔄 Trying direct kill for PID: ${process.pid}`);
              await process.kill();
            } catch (killError) {
              console.error("❌ Error with direct kill:", killError);
            }
          }
        } else {
          console.log("⚠️ No PID available, trying direct kill");
          // If no PID, try to kill directly
          try {
            await process.kill();
          } catch (killError) {
            console.error("❌ Error with direct kill (no PID):", killError);
          }
        }
      } catch (error) {
        console.error("❌ Error in stopProject:", error);
      }
    } else {
      console.log("⚠️ Process not found in map, trying to kill by port");
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

  return {
    selectedDirectory,
    setSelectedDirectory,
    projects,
    setProjects,
    loading,
    runningProjects,
    processes,
    loadProjects,
    runProject,
    stopProject,
  };
};

