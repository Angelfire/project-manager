import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DirectorySelector } from "@/components/DirectorySelector";

describe("DirectorySelector", () => {
  const mockOnSelect = vi.fn();
  const mockOnRescan = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders directory selector with input and select button", () => {
    render(
      <DirectorySelector
        selectedDirectory={null}
        loading={false}
        onSelect={mockOnSelect}
        onRescan={mockOnRescan}
      />
    );

    expect(screen.getByText("Directory")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Select a directory...")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /select/i })).toBeInTheDocument();
  });

  it("displays selected directory in input", () => {
    render(
      <DirectorySelector
        selectedDirectory="/path/to/projects"
        loading={false}
        onSelect={mockOnSelect}
        onRescan={mockOnRescan}
      />
    );

    const input = screen.getByPlaceholderText("Select a directory...");
    expect(input).toHaveValue("/path/to/projects");
  });

  it("shows rescan button when directory is selected", () => {
    render(
      <DirectorySelector
        selectedDirectory="/path/to/projects"
        loading={false}
        onSelect={mockOnSelect}
        onRescan={mockOnRescan}
      />
    );

    expect(screen.getByRole("button", { name: /rescan/i })).toBeInTheDocument();
  });

  it("hides rescan button when no directory is selected", () => {
    render(
      <DirectorySelector
        selectedDirectory={null}
        loading={false}
        onSelect={mockOnSelect}
        onRescan={mockOnRescan}
      />
    );

    expect(
      screen.queryByRole("button", { name: /rescan/i })
    ).not.toBeInTheDocument();
  });

  it("calls onSelect when select button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <DirectorySelector
        selectedDirectory={null}
        loading={false}
        onSelect={mockOnSelect}
        onRescan={mockOnRescan}
      />
    );

    const selectButton = screen.getByRole("button", { name: /select/i });
    await user.click(selectButton);

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnRescan).not.toHaveBeenCalled();
  });

  it("calls onRescan when rescan button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <DirectorySelector
        selectedDirectory="/path/to/projects"
        loading={false}
        onSelect={mockOnSelect}
        onRescan={mockOnRescan}
      />
    );

    const rescanButton = screen.getByRole("button", { name: /rescan/i });
    await user.click(rescanButton);

    expect(mockOnRescan).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it("disables rescan button when loading", () => {
    render(
      <DirectorySelector
        selectedDirectory="/path/to/projects"
        loading={true}
        onSelect={mockOnSelect}
        onRescan={mockOnRescan}
      />
    );

    const rescanButton = screen.getByRole("button", { name: /scanning/i });
    expect(rescanButton).toBeDisabled();
  });

  it("shows 'Scanning' text when loading", () => {
    render(
      <DirectorySelector
        selectedDirectory="/path/to/projects"
        loading={true}
        onSelect={mockOnSelect}
        onRescan={mockOnRescan}
      />
    );

    expect(screen.getByText("Scanning")).toBeInTheDocument();
    expect(screen.queryByText("Rescan")).not.toBeInTheDocument();
  });

  it("shows 'Rescan' text when not loading", () => {
    render(
      <DirectorySelector
        selectedDirectory="/path/to/projects"
        loading={false}
        onSelect={mockOnSelect}
        onRescan={mockOnRescan}
      />
    );

    expect(screen.getByText("Rescan")).toBeInTheDocument();
    expect(screen.queryByText("Scanning")).not.toBeInTheDocument();
  });

  it("input is readonly", () => {
    render(
      <DirectorySelector
        selectedDirectory="/path/to/projects"
        loading={false}
        onSelect={mockOnSelect}
        onRescan={mockOnRescan}
      />
    );

    const input = screen.getByPlaceholderText("Select a directory...");
    expect(input).toHaveAttribute("readOnly");
  });
});
