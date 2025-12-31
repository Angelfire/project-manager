import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectLogs } from "@/components/ProjectLogs";
import type { LogEntry } from "@/types";

vi.mock("@tauri-apps/plugin-dialog", () => ({
  save: vi.fn(() => Promise.resolve("/test/path")),
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
  writeTextFile: vi.fn(() => Promise.resolve()),
}));

describe("ProjectLogs", () => {
  const mockLogs: LogEntry[] = [
    {
      id: "1",
      timestamp: Date.now(),
      type: "stdout",
      content: "Server started on port 3000",
      projectPath: "/test/project",
    },
  ];

  const mockOnClose = vi.fn();
  const mockOnClear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(
      <ProjectLogs
        projectName="Test Project"
        projectPath="/test/project"
        logs={mockLogs}
        isOpen={false}
        onClose={mockOnClose}
        onClear={mockOnClear}
      />
    );

    expect(screen.queryByText("Logs: Test Project")).not.toBeInTheDocument();
  });

  it("displays empty state when there are no logs", () => {
    render(
      <ProjectLogs
        projectName="Test Project"
        projectPath="/test/project"
        logs={[]}
        isOpen={true}
        onClose={mockOnClose}
        onClear={mockOnClear}
      />
    );

    expect(screen.getByText("No logs yet")).toBeInTheDocument();
  });
});
