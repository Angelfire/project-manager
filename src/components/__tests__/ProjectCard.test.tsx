import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectCard } from "@/components/ProjectCard";
import type { Project } from "@/types";
import { Child } from "@tauri-apps/plugin-shell";

// Mock dependencies
vi.mock("@/services/projectService", () => ({
  openProjectInBrowser: vi.fn(),
  detectPort: vi.fn(),
}));

vi.mock("@/components/QuickActionsMenu", () => ({
  QuickActionsMenu: () => <div data-testid="quick-actions-menu" />,
}));

describe("ProjectCard", () => {
  const mockProject: Project = {
    name: "Test Project",
    path: "/path/to/test-project",
    runtime: "Node.js",
    package_manager: "npm",
    port: null,
    framework: "React",
    runtime_version: "20.0.0",
    scripts: { dev: "vite", build: "vite build" },
    size: 1024 * 1024, // 1 MB
    modified: 1705324800, // Jan 15, 2024
  };

  const mockProcesses = new Map<string, Child>();
  const mockGetProjectLogs = vi.fn(
    (_projectPath: string): Array<{ id: string }> => []
  );
  const mockOnRun = vi.fn();
  const mockOnStop = vi.fn();
  const mockOnOpenLogs = vi.fn();
  const mockOnUpdateProject = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcesses.clear();
  });

  it("renders project name and path", () => {
    render(
      <ProjectCard
        project={mockProject}
        isRunning={false}
        processes={mockProcesses}
        getProjectLogs={mockGetProjectLogs}
        onRun={mockOnRun}
        onStop={mockOnStop}
        onOpenLogs={mockOnOpenLogs}
        onUpdateProject={mockOnUpdateProject}
      />
    );

    expect(screen.getByText("Test Project")).toBeInTheDocument();
    // Use getAllByText since the path appears in both the card and QuickActionsMenu mock
    const pathElements = screen.getAllByText("/path/to/test-project");
    expect(pathElements.length).toBeGreaterThan(0);
  });

  it("shows inactive status when project is not running", () => {
    render(
      <ProjectCard
        project={mockProject}
        isRunning={false}
        processes={mockProcesses}
        getProjectLogs={mockGetProjectLogs}
        onRun={mockOnRun}
        onStop={mockOnStop}
        onOpenLogs={mockOnOpenLogs}
        onUpdateProject={mockOnUpdateProject}
      />
    );

    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("shows active status when project is running", () => {
    render(
      <ProjectCard
        project={mockProject}
        isRunning={true}
        processes={mockProcesses}
        getProjectLogs={mockGetProjectLogs}
        onRun={mockOnRun}
        onStop={mockOnStop}
        onOpenLogs={mockOnOpenLogs}
        onUpdateProject={mockOnUpdateProject}
      />
    );

    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("displays runtime badge", () => {
    render(
      <ProjectCard
        project={mockProject}
        isRunning={false}
        processes={mockProcesses}
        getProjectLogs={mockGetProjectLogs}
        onRun={mockOnRun}
        onStop={mockOnStop}
        onOpenLogs={mockOnOpenLogs}
        onUpdateProject={mockOnUpdateProject}
      />
    );

    expect(screen.getByText("Node.js")).toBeInTheDocument();
  });

  it("displays package manager badge when available", () => {
    render(
      <ProjectCard
        project={mockProject}
        isRunning={false}
        processes={mockProcesses}
        getProjectLogs={mockGetProjectLogs}
        onRun={mockOnRun}
        onStop={mockOnStop}
        onOpenLogs={mockOnOpenLogs}
        onUpdateProject={mockOnUpdateProject}
      />
    );

    expect(screen.getByText("npm")).toBeInTheDocument();
  });

  it("displays port badge when project is running and has port", () => {
    const projectWithPort = { ...mockProject, port: 3000 };
    render(
      <ProjectCard
        project={projectWithPort}
        isRunning={true}
        processes={mockProcesses}
        getProjectLogs={mockGetProjectLogs}
        onRun={mockOnRun}
        onStop={mockOnStop}
        onOpenLogs={mockOnOpenLogs}
        onUpdateProject={mockOnUpdateProject}
      />
    );

    expect(screen.getByText(":3000")).toBeInTheDocument();
  });

  it("does not display port badge when project is not running", () => {
    const projectWithPort = { ...mockProject, port: 3000 };
    render(
      <ProjectCard
        project={projectWithPort}
        isRunning={false}
        processes={mockProcesses}
        getProjectLogs={mockGetProjectLogs}
        onRun={mockOnRun}
        onStop={mockOnStop}
        onOpenLogs={mockOnOpenLogs}
        onUpdateProject={mockOnUpdateProject}
      />
    );

    expect(screen.queryByText(":3000")).not.toBeInTheDocument();
  });

  it("displays runtime version when available", () => {
    render(
      <ProjectCard
        project={mockProject}
        isRunning={false}
        processes={mockProcesses}
        getProjectLogs={mockGetProjectLogs}
        onRun={mockOnRun}
        onStop={mockOnStop}
        onOpenLogs={mockOnOpenLogs}
        onUpdateProject={mockOnUpdateProject}
      />
    );

    expect(screen.getByText(/Node\.js 20\.0\.0/)).toBeInTheDocument();
  });

  it("displays formatted file size", () => {
    render(
      <ProjectCard
        project={mockProject}
        isRunning={false}
        processes={mockProcesses}
        getProjectLogs={mockGetProjectLogs}
        onRun={mockOnRun}
        onStop={mockOnStop}
        onOpenLogs={mockOnOpenLogs}
        onUpdateProject={mockOnUpdateProject}
      />
    );

    expect(screen.getByText(/1\.0 MB/)).toBeInTheDocument();
  });

  it("displays formatted date", () => {
    render(
      <ProjectCard
        project={mockProject}
        isRunning={false}
        processes={mockProcesses}
        getProjectLogs={mockGetProjectLogs}
        onRun={mockOnRun}
        onStop={mockOnStop}
        onOpenLogs={mockOnOpenLogs}
        onUpdateProject={mockOnUpdateProject}
      />
    );

    // Note: toLocaleDateString uses local timezone, so the date may vary
    // Timestamp 1705324800 is Jan 15, 2024 12:00:00 UTC
    // Should be Jan 15 or Jan 14 depending on timezone
    expect(screen.getByText(/(Jan 14|Jan 15), 2024/)).toBeInTheDocument();
  });

  it("displays scripts count when available", () => {
    render(
      <ProjectCard
        project={mockProject}
        isRunning={false}
        processes={mockProcesses}
        getProjectLogs={mockGetProjectLogs}
        onRun={mockOnRun}
        onStop={mockOnStop}
        onOpenLogs={mockOnOpenLogs}
        onUpdateProject={mockOnUpdateProject}
      />
    );

    expect(screen.getByText("2 scripts")).toBeInTheDocument();
  });

  it("shows Run button when project is not running", () => {
    render(
      <ProjectCard
        project={mockProject}
        isRunning={false}
        processes={mockProcesses}
        getProjectLogs={mockGetProjectLogs}
        onRun={mockOnRun}
        onStop={mockOnStop}
        onOpenLogs={mockOnOpenLogs}
        onUpdateProject={mockOnUpdateProject}
      />
    );

    expect(screen.getByRole("button", { name: /run/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /stop/i })
    ).not.toBeInTheDocument();
  });

  it("shows Stop button when project is running", () => {
    render(
      <ProjectCard
        project={mockProject}
        isRunning={true}
        processes={mockProcesses}
        getProjectLogs={mockGetProjectLogs}
        onRun={mockOnRun}
        onStop={mockOnStop}
        onOpenLogs={mockOnOpenLogs}
        onUpdateProject={mockOnUpdateProject}
      />
    );

    expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /run/i })
    ).not.toBeInTheDocument();
  });

  it("calls onRun when Run button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ProjectCard
        project={mockProject}
        isRunning={false}
        processes={mockProcesses}
        getProjectLogs={mockGetProjectLogs}
        onRun={mockOnRun}
        onStop={mockOnStop}
        onOpenLogs={mockOnOpenLogs}
        onUpdateProject={mockOnUpdateProject}
      />
    );

    const runButton = screen.getByRole("button", { name: /run/i });
    await user.click(runButton);

    expect(mockOnRun).toHaveBeenCalledTimes(1);
    expect(mockOnRun).toHaveBeenCalledWith(mockProject);
  });

  it("calls onStop when Stop button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ProjectCard
        project={mockProject}
        isRunning={true}
        processes={mockProcesses}
        getProjectLogs={mockGetProjectLogs}
        onRun={mockOnRun}
        onStop={mockOnStop}
        onOpenLogs={mockOnOpenLogs}
        onUpdateProject={mockOnUpdateProject}
      />
    );

    const stopButton = screen.getByRole("button", { name: /stop/i });
    await user.click(stopButton);

    expect(mockOnStop).toHaveBeenCalledTimes(1);
    expect(mockOnStop).toHaveBeenCalledWith(mockProject);
  });

  it("calls onOpenLogs when View logs button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ProjectCard
        project={mockProject}
        isRunning={true}
        processes={mockProcesses}
        getProjectLogs={mockGetProjectLogs}
        onRun={mockOnRun}
        onStop={mockOnStop}
        onOpenLogs={mockOnOpenLogs}
        onUpdateProject={mockOnUpdateProject}
      />
    );

    const logsButton = screen.getByRole("button", { name: /view logs/i });
    await user.click(logsButton);

    expect(mockOnOpenLogs).toHaveBeenCalledTimes(1);
    expect(mockOnOpenLogs).toHaveBeenCalledWith(mockProject.path);
  });

  it("shows View logs button when project has logs and is not running", () => {
    mockGetProjectLogs.mockReturnValue([{ id: "1" }]);
    render(
      <ProjectCard
        project={mockProject}
        isRunning={false}
        processes={mockProcesses}
        getProjectLogs={mockGetProjectLogs}
        onRun={mockOnRun}
        onStop={mockOnStop}
        onOpenLogs={mockOnOpenLogs}
        onUpdateProject={mockOnUpdateProject}
      />
    );

    expect(
      screen.getByRole("button", { name: /view logs/i })
    ).toBeInTheDocument();
  });

  it("hides View logs button when project has no logs and is not running", () => {
    mockGetProjectLogs.mockReturnValue([]);
    render(
      <ProjectCard
        project={mockProject}
        isRunning={false}
        processes={mockProcesses}
        getProjectLogs={mockGetProjectLogs}
        onRun={mockOnRun}
        onStop={mockOnStop}
        onOpenLogs={mockOnOpenLogs}
        onUpdateProject={mockOnUpdateProject}
      />
    );

    expect(
      screen.queryByRole("button", { name: /view logs/i })
    ).not.toBeInTheDocument();
  });

  it("renders QuickActionsMenu", () => {
    render(
      <ProjectCard
        project={mockProject}
        isRunning={false}
        processes={mockProcesses}
        getProjectLogs={mockGetProjectLogs}
        onRun={mockOnRun}
        onStop={mockOnStop}
        onOpenLogs={mockOnOpenLogs}
        onUpdateProject={mockOnUpdateProject}
      />
    );

    expect(screen.getByTestId("quick-actions-menu")).toBeInTheDocument();
  });
});
