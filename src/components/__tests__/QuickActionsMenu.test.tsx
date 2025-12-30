import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuickActionsMenu } from "@/components/QuickActionsMenu";
import * as tauriCore from "@tauri-apps/api/core";
import * as toastUtils from "@/utils/toast";

// Mock Tauri APIs
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

// Mock toast utilities
vi.mock("../../utils/toast", () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

describe("QuickActionsMenu", () => {
  const mockProjectPath = "/test/project/path";

  beforeEach(() => {
    vi.clearAllMocks();
    // Silence console.error for error tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders the menu trigger button", () => {
    render(<QuickActionsMenu projectPath={mockProjectPath} />);

    const triggerButton = screen.getByTitle("Quick actions");
    expect(triggerButton).toBeInTheDocument();
  });

  it("opens menu when trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<QuickActionsMenu projectPath={mockProjectPath} />);

    const triggerButton = screen.getByTitle("Quick actions");
    await user.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText("Open in Editor")).toBeInTheDocument();
    });
  });

  it("displays all menu items when opened", async () => {
    const user = userEvent.setup();
    render(<QuickActionsMenu projectPath={mockProjectPath} />);

    const triggerButton = screen.getByTitle("Quick actions");
    await user.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText("Open in Editor")).toBeInTheDocument();
      expect(screen.getByText("Open in Terminal")).toBeInTheDocument();
      expect(screen.getByText("Open in Finder")).toBeInTheDocument();
      expect(screen.getByText("Copy Path")).toBeInTheDocument();
    });
  });

  it("calls invoke with correct path when 'Open in Editor' is clicked", async () => {
    const user = userEvent.setup();
    const mockInvoke = vi.mocked(tauriCore.invoke);
    mockInvoke.mockResolvedValue(undefined);

    render(<QuickActionsMenu projectPath={mockProjectPath} />);

    const triggerButton = screen.getByTitle("Quick actions");
    await user.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText("Open in Editor")).toBeInTheDocument();
    });

    const editorItem = screen.getByText("Open in Editor");
    await user.click(editorItem);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("open_in_editor", {
        path: mockProjectPath,
      });
    });
  });

  it("calls invoke with correct path when 'Open in Terminal' is clicked", async () => {
    const user = userEvent.setup();
    const mockInvoke = vi.mocked(tauriCore.invoke);
    mockInvoke.mockResolvedValue(undefined);

    render(<QuickActionsMenu projectPath={mockProjectPath} />);

    const triggerButton = screen.getByTitle("Quick actions");
    await user.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText("Open in Terminal")).toBeInTheDocument();
    });

    const terminalItem = screen.getByText("Open in Terminal");
    await user.click(terminalItem);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("open_in_terminal", {
        path: mockProjectPath,
      });
    });
  });

  it("calls invoke with correct path when 'Open in Finder' is clicked", async () => {
    const user = userEvent.setup();
    const mockInvoke = vi.mocked(tauriCore.invoke);
    mockInvoke.mockResolvedValue(undefined);

    render(<QuickActionsMenu projectPath={mockProjectPath} />);

    const triggerButton = screen.getByTitle("Quick actions");
    await user.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText("Open in Finder")).toBeInTheDocument();
    });

    const finderItem = screen.getByText("Open in Finder");
    await user.click(finderItem);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("open_in_finder", {
        path: mockProjectPath,
      });
    });
  });

  it("copies path to clipboard when 'Copy Path' is clicked", async () => {
    const user = userEvent.setup();

    // Mock clipboard API
    const mockWriteText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      writable: true,
    });

    render(<QuickActionsMenu projectPath={mockProjectPath} />);

    const triggerButton = screen.getByTitle("Quick actions");
    await user.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText("Copy Path")).toBeInTheDocument();
    });

    const copyItem = screen.getByText("Copy Path");
    await user.click(copyItem);

    await waitFor(
      () => {
        expect(mockWriteText).toHaveBeenCalledWith(mockProjectPath);
      },
      { timeout: 2000 }
    );
  });

  it("shows success toast when path is copied successfully", async () => {
    const user = userEvent.setup();
    const mockToastSuccess = vi.mocked(toastUtils.toastSuccess);

    const mockWriteText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      writable: true,
    });

    render(<QuickActionsMenu projectPath={mockProjectPath} />);

    const triggerButton = screen.getByTitle("Quick actions");
    await user.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText("Copy Path")).toBeInTheDocument();
    });

    const copyItem = screen.getByText("Copy Path");
    await user.click(copyItem);

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith("Path copied to clipboard");
    });
  });

  it("shows error toast when copy fails", async () => {
    const user = userEvent.setup();
    const mockToastError = vi.mocked(toastUtils.toastError);
    const mockError = new Error("Clipboard access denied");

    const mockWriteText = vi.fn(() => Promise.reject(mockError));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      writable: true,
    });

    render(<QuickActionsMenu projectPath={mockProjectPath} />);

    const triggerButton = screen.getByTitle("Quick actions");
    await user.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText("Copy Path")).toBeInTheDocument();
    });

    const copyItem = screen.getByText("Copy Path");
    await user.click(copyItem);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Failed to copy path",
        "Error: Clipboard access denied"
      );
    });
  });

  it("shows error toast when 'Open in Editor' fails", async () => {
    const user = userEvent.setup();
    const mockInvoke = vi.mocked(tauriCore.invoke);
    const mockToastError = vi.mocked(toastUtils.toastError);
    const mockError = new Error("Editor not found");

    mockInvoke.mockRejectedValue(mockError);

    render(<QuickActionsMenu projectPath={mockProjectPath} />);

    const triggerButton = screen.getByTitle("Quick actions");
    await user.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText("Open in Editor")).toBeInTheDocument();
    });

    const editorItem = screen.getByText("Open in Editor");
    await user.click(editorItem);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Failed to open in editor",
        "Error: Editor not found"
      );
    });
  });

  it("shows error toast when 'Open in Terminal' fails", async () => {
    const user = userEvent.setup();
    const mockInvoke = vi.mocked(tauriCore.invoke);
    const mockToastError = vi.mocked(toastUtils.toastError);
    const mockError = new Error("Terminal command failed");

    mockInvoke.mockRejectedValue(mockError);

    render(<QuickActionsMenu projectPath={mockProjectPath} />);

    const triggerButton = screen.getByTitle("Quick actions");
    await user.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText("Open in Terminal")).toBeInTheDocument();
    });

    const terminalItem = screen.getByText("Open in Terminal");
    await user.click(terminalItem);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Failed to open in terminal",
        "Error: Terminal command failed"
      );
    });
  });

  it("shows error toast when 'Open in Finder' fails", async () => {
    const user = userEvent.setup();
    const mockInvoke = vi.mocked(tauriCore.invoke);
    const mockToastError = vi.mocked(toastUtils.toastError);
    const mockError = new Error("Path not found");

    mockInvoke.mockRejectedValue(mockError);

    render(<QuickActionsMenu projectPath={mockProjectPath} />);

    const triggerButton = screen.getByTitle("Quick actions");
    await user.click(triggerButton);

    await waitFor(() => {
      expect(screen.getByText("Open in Finder")).toBeInTheDocument();
    });

    const finderItem = screen.getByText("Open in Finder");
    await user.click(finderItem);

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        "Failed to open in Finder",
        "Error: Path not found"
      );
    });
  });
});
