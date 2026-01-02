import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSearchInput } from "../useSearchInput";
import * as validation from "@/utils/validation";

// Mock the validation module
vi.mock("@/utils/validation", () => ({
  validateSearchTerm: vi.fn(),
}));

describe("useSearchInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with empty search term and no error", () => {
    vi.mocked(validation.validateSearchTerm).mockReturnValue("test");
    const { result } = renderHook(() => useSearchInput());

    expect(result.current.searchTerm).toBe("");
    expect(result.current.searchError).toBeNull();
  });

  it("should update search term when valid input is provided", () => {
    vi.mocked(validation.validateSearchTerm).mockReturnValue("react");
    const { result } = renderHook(() => useSearchInput());

    act(() => {
      result.current.handleChange("react");
    });

    expect(result.current.searchTerm).toBe("react");
    expect(result.current.searchError).toBeNull();
    expect(validation.validateSearchTerm).toHaveBeenCalledWith("react");
  });

  it("should clear search term when empty string is provided", () => {
    vi.mocked(validation.validateSearchTerm).mockReturnValue("test");
    const { result } = renderHook(() => useSearchInput());

    // Set an initial value
    act(() => {
      result.current.handleChange("test");
    });

    // Clear it
    act(() => {
      result.current.handleChange("");
    });

    expect(result.current.searchTerm).toBe("");
    expect(result.current.searchError).toBeNull();
    // Should not call validateSearchTerm for empty string
    expect(validation.validateSearchTerm).toHaveBeenCalledTimes(1);
  });

  it("should set error when validation returns null", () => {
    vi.mocked(validation.validateSearchTerm).mockReturnValue(null);
    const { result } = renderHook(() => useSearchInput());

    act(() => {
      result.current.handleChange("<script>alert('xss')</script>");
    });

    expect(result.current.searchTerm).toBe("");
    expect(result.current.searchError).toBe(
      'Your search contains unsupported characters (e.g., <, >, "). Please remove them and try again.'
    );
  });

  it("should set warning when validation sanitizes input", () => {
    vi.mocked(validation.validateSearchTerm).mockReturnValue("react");
    const { result } = renderHook(() => useSearchInput());

    act(() => {
      result.current.handleChange("react<script>");
    });

    expect(result.current.searchTerm).toBe("react");
    expect(result.current.searchError).toBe(
      'Your search contained unsupported characters (e.g., <, >, "), which were removed.'
    );
  });

  it("should clear error on subsequent valid input", () => {
    vi.mocked(validation.validateSearchTerm)
      .mockReturnValueOnce(null)
      .mockReturnValueOnce("valid");

    const { result } = renderHook(() => useSearchInput());

    // First input is invalid
    act(() => {
      result.current.handleChange("<script>");
    });

    expect(result.current.searchError).not.toBeNull();

    // Second input is valid
    act(() => {
      result.current.handleChange("valid");
    });

    expect(result.current.searchTerm).toBe("valid");
    expect(result.current.searchError).toBeNull();
  });

  it("should allow direct setting of search term", () => {
    vi.mocked(validation.validateSearchTerm).mockReturnValue("test");
    const { result } = renderHook(() => useSearchInput());

    act(() => {
      result.current.setSearchTerm("direct");
    });

    expect(result.current.searchTerm).toBe("direct");
    // setSearchTerm should not trigger validation
    expect(validation.validateSearchTerm).not.toHaveBeenCalled();
  });
});
