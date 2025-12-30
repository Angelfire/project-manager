import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectFilters, type FilterOption } from "@/components/ProjectFilters";

describe("ProjectFilters", () => {
  const mockFilters: FilterOption = {
    runtime: null,
    framework: null,
    status: "all",
  };

  const mockOnFiltersChange = vi.fn();
  const uniqueRuntimes = ["Node.js", "Deno", "Bun"];
  const uniqueFrameworks = ["React", "Vue", "Svelte"];

  it("renders all filter sections", () => {
    render(
      <ProjectFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        uniqueRuntimes={uniqueRuntimes}
        uniqueFrameworks={uniqueFrameworks}
      />
    );

    expect(screen.getByText("Runtime")).toBeInTheDocument();
    expect(screen.getByText("Framework")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("renders runtime select with placeholder", () => {
    render(
      <ProjectFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        uniqueRuntimes={uniqueRuntimes}
        uniqueFrameworks={uniqueFrameworks}
      />
    );

    expect(screen.getByText("All Runtimes")).toBeInTheDocument();
  });

  it("renders framework select with placeholder", () => {
    render(
      <ProjectFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        uniqueRuntimes={uniqueRuntimes}
        uniqueFrameworks={uniqueFrameworks}
      />
    );

    expect(screen.getByText("All Frameworks")).toBeInTheDocument();
  });

  it("renders status select with current value", () => {
    render(
      <ProjectFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        uniqueRuntimes={uniqueRuntimes}
        uniqueFrameworks={uniqueFrameworks}
      />
    );

    expect(screen.getByText("All Status")).toBeInTheDocument();
  });

  it("shows 'All Runtimes' when runtime is null", () => {
    render(
      <ProjectFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        uniqueRuntimes={uniqueRuntimes}
        uniqueFrameworks={uniqueFrameworks}
      />
    );

    const runtimeSelect = screen.getByText("All Runtimes");
    expect(runtimeSelect).toBeInTheDocument();
  });

  it("shows 'All Frameworks' when framework is null", () => {
    render(
      <ProjectFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        uniqueRuntimes={uniqueRuntimes}
        uniqueFrameworks={uniqueFrameworks}
      />
    );

    const frameworkSelect = screen.getByText("All Frameworks");
    expect(frameworkSelect).toBeInTheDocument();
  });
});
