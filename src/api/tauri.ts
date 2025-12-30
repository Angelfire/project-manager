import { invoke } from "@tauri-apps/api/core";
import { Project } from "@/types";

/**
 * Tauri API abstraction layer
 * Provides a centralized interface for all Tauri backend commands
 */
export const tauriApi = {
  /**
   * Project-related commands
   */
  projects: {
    /**
     * Scan a directory for projects
     * @param path - Directory path to scan
     * @returns Array of detected projects
     */
    scan: (path: string): Promise<Project[]> => {
      return invoke<Project[]>("scan_directory", { path });
    },
  },

  /**
   * Process management commands
   */
  processes: {
    /**
     * Kill a process tree by PID
     * @param pid - Process ID to kill
     */
    killTree: (pid: number): Promise<void> => {
      return invoke<void>("kill_process_tree", { pid });
    },

    /**
     * Detect the port used by a process
     * @param pid - Process ID
     * @returns Port number if detected, null otherwise
     */
    detectPort: (pid: number): Promise<number | null> => {
      return invoke<number | null>("detect_port_by_pid", { pid });
    },
  },

  /**
   * Quick actions commands
   */
  quickActions: {
    /**
     * Open a path in the default editor (e.g., VS Code)
     * @param path - Path to open
     */
    openInEditor: (path: string): Promise<void> => {
      return invoke<void>("open_in_editor", { path });
    },

    /**
     * Open a path in the default terminal
     * @param path - Path to open
     */
    openInTerminal: (path: string): Promise<void> => {
      return invoke<void>("open_in_terminal", { path });
    },

    /**
     * Open a path in the system file manager
     * @param path - Path to open
     */
    openInFileManager: (path: string): Promise<void> => {
      return invoke<void>("open_in_file_manager", { path });
    },
  },
};
