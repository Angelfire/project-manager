import { describe, it, expect, vi, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { tauriApi } from "@/api/tauri";
import { Project } from "@/types";

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("tauriApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("projects", () => {
    describe("scan", () => {
      it("calls invoke with correct command and path", async () => {
        const mockProjects: Project[] = [
          {
            name: "test-project",
            path: "/path/to/project",
            runtime: "Node.js",
            package_manager: "npm",
            port: null,
            framework: "React",
            runtime_version: "20.0.0",
            scripts: { dev: "vite" },
            size: 1024,
            modified: Date.now(),
          },
        ];

        vi.mocked(invoke).mockResolvedValue(mockProjects);

        const result = await tauriApi.projects.scan("/path/to/directory");

        expect(invoke).toHaveBeenCalledTimes(1);
        expect(invoke).toHaveBeenCalledWith<[string, { path: string }]>(
          "scan_directory",
          { path: "/path/to/directory" }
        );
        expect(result).toEqual(mockProjects);
      });

      it("returns empty array when no projects found", async () => {
        vi.mocked(invoke).mockResolvedValue([]);

        const result = await tauriApi.projects.scan("/empty/directory");

        expect(invoke).toHaveBeenCalledWith("scan_directory", {
          path: "/empty/directory",
        });
        expect(result).toEqual([]);
      });

      it("propagates errors from invoke", async () => {
        const mockError = new Error("Directory not found");
        vi.mocked(invoke).mockRejectedValue(mockError);

        await expect(tauriApi.projects.scan("/invalid/path")).rejects.toThrow(
          "Directory not found"
        );

        expect(invoke).toHaveBeenCalledWith("scan_directory", {
          path: "/invalid/path",
        });
      });
    });
  });

  describe("processes", () => {
    describe("killTree", () => {
      it("calls invoke with correct command and pid", async () => {
        vi.mocked(invoke).mockResolvedValue(undefined);

        await tauriApi.processes.killTree(12345);

        expect(invoke).toHaveBeenCalledTimes(1);
        expect(invoke).toHaveBeenCalledWith<[string, { pid: number }]>(
          "kill_process_tree",
          { pid: 12345 }
        );
      });

      it("handles different pid values", async () => {
        vi.mocked(invoke).mockResolvedValue(undefined);

        await tauriApi.processes.killTree(0);
        expect(invoke).toHaveBeenCalledWith("kill_process_tree", { pid: 0 });

        vi.clearAllMocks();

        await tauriApi.processes.killTree(99999);
        expect(invoke).toHaveBeenCalledWith("kill_process_tree", {
          pid: 99999,
        });
      });

      it("propagates errors from invoke", async () => {
        const mockError = new Error("Process not found");
        vi.mocked(invoke).mockRejectedValue(mockError);

        await expect(tauriApi.processes.killTree(99999)).rejects.toThrow(
          "Process not found"
        );

        expect(invoke).toHaveBeenCalledWith("kill_process_tree", {
          pid: 99999,
        });
      });
    });

    describe("detectPort", () => {
      it("calls invoke with correct command and pid", async () => {
        vi.mocked(invoke).mockResolvedValue(3000);

        const result = await tauriApi.processes.detectPort(12345);

        expect(invoke).toHaveBeenCalledTimes(1);
        expect(invoke).toHaveBeenCalledWith<[string, { pid: number }]>(
          "detect_port_by_pid",
          { pid: 12345 }
        );
        expect(result).toBe(3000);
      });

      it("returns null when port is not detected", async () => {
        vi.mocked(invoke).mockResolvedValue(null);

        const result = await tauriApi.processes.detectPort(12345);

        expect(invoke).toHaveBeenCalledWith("detect_port_by_pid", {
          pid: 12345,
        });
        expect(result).toBeNull();
      });

      it("handles different port values", async () => {
        vi.mocked(invoke).mockResolvedValue(8080);

        const result = await tauriApi.processes.detectPort(54321);

        expect(invoke).toHaveBeenCalledWith("detect_port_by_pid", {
          pid: 54321,
        });
        expect(result).toBe(8080);
      });

      it("propagates errors from invoke", async () => {
        const mockError = new Error("Port detection failed");
        vi.mocked(invoke).mockRejectedValue(mockError);

        await expect(tauriApi.processes.detectPort(12345)).rejects.toThrow(
          "Port detection failed"
        );

        expect(invoke).toHaveBeenCalledWith("detect_port_by_pid", {
          pid: 12345,
        });
      });
    });
  });

  describe("quickActions", () => {
    describe("openInEditor", () => {
      it("calls invoke with correct command and path", async () => {
        vi.mocked(invoke).mockResolvedValue(undefined);

        await tauriApi.quickActions.openInEditor("/path/to/project");

        expect(invoke).toHaveBeenCalledTimes(1);
        expect(invoke).toHaveBeenCalledWith<[string, { path: string }]>(
          "open_in_editor",
          { path: "/path/to/project" }
        );
      });

      it("handles different paths", async () => {
        vi.mocked(invoke).mockResolvedValue(undefined);

        await tauriApi.quickActions.openInEditor("/home/user/project");
        expect(invoke).toHaveBeenCalledWith("open_in_editor", {
          path: "/home/user/project",
        });

        vi.clearAllMocks();

        await tauriApi.quickActions.openInEditor("/tmp/test");
        expect(invoke).toHaveBeenCalledWith("open_in_editor", {
          path: "/tmp/test",
        });
      });

      it("propagates errors from invoke", async () => {
        const mockError = new Error("Editor not found");
        vi.mocked(invoke).mockRejectedValue(mockError);

        await expect(
          tauriApi.quickActions.openInEditor("/path/to/project")
        ).rejects.toThrow("Editor not found");

        expect(invoke).toHaveBeenCalledWith("open_in_editor", {
          path: "/path/to/project",
        });
      });
    });

    describe("openInTerminal", () => {
      it("calls invoke with correct command and path", async () => {
        vi.mocked(invoke).mockResolvedValue(undefined);

        await tauriApi.quickActions.openInTerminal("/path/to/project");

        expect(invoke).toHaveBeenCalledTimes(1);
        expect(invoke).toHaveBeenCalledWith<[string, { path: string }]>(
          "open_in_terminal",
          { path: "/path/to/project" }
        );
      });

      it("handles different paths", async () => {
        vi.mocked(invoke).mockResolvedValue(undefined);

        await tauriApi.quickActions.openInTerminal("/home/user/project");
        expect(invoke).toHaveBeenCalledWith("open_in_terminal", {
          path: "/home/user/project",
        });
      });

      it("propagates errors from invoke", async () => {
        const mockError = new Error("Terminal not found");
        vi.mocked(invoke).mockRejectedValue(mockError);

        await expect(
          tauriApi.quickActions.openInTerminal("/path/to/project")
        ).rejects.toThrow("Terminal not found");

        expect(invoke).toHaveBeenCalledWith("open_in_terminal", {
          path: "/path/to/project",
        });
      });
    });

    describe("openInFileManager", () => {
      it("calls invoke with correct command and path", async () => {
        vi.mocked(invoke).mockResolvedValue(undefined);

        await tauriApi.quickActions.openInFileManager("/path/to/project");

        expect(invoke).toHaveBeenCalledTimes(1);
        expect(invoke).toHaveBeenCalledWith<[string, { path: string }]>(
          "open_in_file_manager",
          { path: "/path/to/project" }
        );
      });

      it("handles different paths", async () => {
        vi.mocked(invoke).mockResolvedValue(undefined);

        await tauriApi.quickActions.openInFileManager("/home/user/project");
        expect(invoke).toHaveBeenCalledWith("open_in_file_manager", {
          path: "/home/user/project",
        });

        vi.clearAllMocks();

        await tauriApi.quickActions.openInFileManager("/tmp/test");
        expect(invoke).toHaveBeenCalledWith("open_in_file_manager", {
          path: "/tmp/test",
        });
      });

      it("propagates errors from invoke", async () => {
        const mockError = new Error("File manager not found");
        vi.mocked(invoke).mockRejectedValue(mockError);

        await expect(
          tauriApi.quickActions.openInFileManager("/path/to/project")
        ).rejects.toThrow("File manager not found");

        expect(invoke).toHaveBeenCalledWith("open_in_file_manager", {
          path: "/path/to/project",
        });
      });
    });
  });
});
