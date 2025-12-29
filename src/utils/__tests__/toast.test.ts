import { describe, it, expect, vi, beforeEach } from "vitest";
import * as sonner from "sonner";
import {
  toastSuccess,
  toastError,
  toastWarning,
  toastInfo,
  toastLoading,
  toastPromise,
} from "../toast";

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    promise: vi.fn(),
  },
}));

describe("toast utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("toastSuccess", () => {
    it("calls toast.success with message and default options", () => {
      toastSuccess("Operation completed");

      expect(sonner.toast.success).toHaveBeenCalledWith("Operation completed", {
        description: undefined,
        duration: 3000,
      });
    });

    it("calls toast.success with message and description", () => {
      toastSuccess("Operation completed", "Your logs have been exported");

      expect(sonner.toast.success).toHaveBeenCalledWith("Operation completed", {
        description: "Your logs have been exported",
        duration: 3000,
      });
    });

    it("returns the toast id", () => {
      const mockId = "toast-123";
      vi.mocked(sonner.toast.success).mockReturnValue(mockId as any);

      const result = toastSuccess("Test");

      expect(result).toBe(mockId);
    });
  });

  describe("toastError", () => {
    it("calls toast.error with message and default options", () => {
      toastError("Operation failed");

      expect(sonner.toast.error).toHaveBeenCalledWith("Operation failed", {
        description: undefined,
        duration: 5000,
      });
    });

    it("calls toast.error with message and description", () => {
      toastError("Operation failed", "Editor not found");

      expect(sonner.toast.error).toHaveBeenCalledWith("Operation failed", {
        description: "Editor not found",
        duration: 5000,
      });
    });

    it("uses longer duration for errors (5000ms)", () => {
      toastError("Error message");

      expect(sonner.toast.error).toHaveBeenCalledWith(
        "Error message",
        expect.objectContaining({
          duration: 5000,
        })
      );
    });
  });

  describe("toastWarning", () => {
    it("calls toast.warning with message and default options", () => {
      toastWarning("Warning message");

      expect(sonner.toast.warning).toHaveBeenCalledWith("Warning message", {
        description: undefined,
        duration: 4000,
      });
    });

    it("calls toast.warning with message and description", () => {
      toastWarning("Port not available", "The server may be starting...");

      expect(sonner.toast.warning).toHaveBeenCalledWith("Port not available", {
        description: "The server may be starting...",
        duration: 4000,
      });
    });

    it("uses medium duration for warnings (4000ms)", () => {
      toastWarning("Warning");

      expect(sonner.toast.warning).toHaveBeenCalledWith(
        "Warning",
        expect.objectContaining({
          duration: 4000,
        })
      );
    });
  });

  describe("toastInfo", () => {
    it("calls toast.info with message and default options", () => {
      toastInfo("Info message");

      expect(sonner.toast.info).toHaveBeenCalledWith("Info message", {
        description: undefined,
        duration: 3000,
      });
    });

    it("calls toast.info with message and description", () => {
      toastInfo("No logs to export", "There are no logs available");

      expect(sonner.toast.info).toHaveBeenCalledWith("No logs to export", {
        description: "There are no logs available",
        duration: 3000,
      });
    });
  });

  describe("toastLoading", () => {
    it("calls toast.loading with message", () => {
      toastLoading("Processing...");

      expect(sonner.toast.loading).toHaveBeenCalledWith("Processing...");
    });

    it("returns the toast id", () => {
      const mockId = "loading-toast-456";
      vi.mocked(sonner.toast.loading).mockReturnValue(mockId as any);

      const result = toastLoading("Loading");

      expect(result).toBe(mockId);
    });
  });

  describe("toastPromise", () => {
    it("calls toast.promise with promise and messages", () => {
      const promise = Promise.resolve("Success");
      const messages = {
        loading: "Loading...",
        success: "Done!",
        error: "Failed!",
      };

      toastPromise(promise, messages);

      expect(sonner.toast.promise).toHaveBeenCalledWith(promise, messages);
    });

    it("handles function-based success message", () => {
      const promise = Promise.resolve({ data: "test" });
      const messages = {
        loading: "Loading...",
        success: (data: { data: string }) => `Got ${data.data}`,
        error: "Failed!",
      };

      toastPromise(promise, messages);

      expect(sonner.toast.promise).toHaveBeenCalledWith(promise, messages);
    });

    it("handles function-based error message", async () => {
      const promise = Promise.reject(new Error("Test error"));
      const messages = {
        loading: "Loading...",
        success: "Done!",
        error: (err: Error) => `Error: ${err.message}`,
      };

      toastPromise(promise, messages);

      expect(sonner.toast.promise).toHaveBeenCalledWith(promise, messages);
      
      // Catch the rejection to avoid unhandled promise rejection warning
      promise.catch(() => {});
    });
  });
});

