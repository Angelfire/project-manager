import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog } from "../dialog";

describe("Dialog", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: <div>Dialog content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset body overflow
    document.body.style.overflow = "";
  });

  afterEach(() => {
    // Clean up body overflow
    document.body.style.overflow = "";
  });

  describe("Rendering", () => {
    it("should not render when isOpen is false", () => {
      render(<Dialog {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should render when isOpen is true", () => {
      render(<Dialog {...defaultProps} />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Dialog content")).toBeInTheDocument();
    });

    it("should render title when provided", () => {
      render(<Dialog {...defaultProps} title="Test Dialog" />);
      expect(screen.getByText("Test Dialog")).toBeInTheDocument();
      expect(screen.getByText("Test Dialog")).toHaveAttribute(
        "id",
        "dialog-title"
      );
    });

    it("should render subtitle when provided", () => {
      render(<Dialog {...defaultProps} subtitle="Test subtitle" />);
      expect(screen.getByText("Test subtitle")).toBeInTheDocument();
    });

    it("should render both title and subtitle", () => {
      render(
        <Dialog
          {...defaultProps}
          title="Test Dialog"
          subtitle="Test subtitle"
        />
      );
      expect(screen.getByText("Test Dialog")).toBeInTheDocument();
      expect(screen.getByText("Test subtitle")).toBeInTheDocument();
    });

    it("should render close button by default", () => {
      render(<Dialog {...defaultProps} />);
      const closeButton = screen.getByLabelText("Close dialog");
      expect(closeButton).toBeInTheDocument();
    });

    it("should not render close button when showCloseButton is false", () => {
      render(<Dialog {...defaultProps} showCloseButton={false} />);
      expect(screen.queryByLabelText("Close dialog")).not.toBeInTheDocument();
    });

    it("should render headerActions when provided", () => {
      const headerActions = <button>Custom Action</button>;
      render(<Dialog {...defaultProps} headerActions={headerActions} />);
      expect(screen.getByText("Custom Action")).toBeInTheDocument();
    });

    it("should not render header when no title, subtitle, close button, or actions", () => {
      render(
        <Dialog
          {...defaultProps}
          title={undefined}
          subtitle={undefined}
          showCloseButton={false}
          headerActions={undefined}
        />
      );
      // Header should not be rendered - no heading should exist
      expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    });
  });

  describe("Sizes", () => {
    it("should apply default size (md)", () => {
      render(<Dialog {...defaultProps} />);
      const dialogContent = screen.getByTestId("dialog-content");
      expect(dialogContent).toHaveClass("max-w-lg");
    });

    it("should apply sm size", () => {
      render(<Dialog {...defaultProps} size="sm" />);
      const dialogContent = screen.getByTestId("dialog-content");
      expect(dialogContent).toHaveClass("max-w-md");
    });

    it("should apply lg size", () => {
      render(<Dialog {...defaultProps} size="lg" />);
      const dialogContent = screen.getByTestId("dialog-content");
      expect(dialogContent).toHaveClass("max-w-2xl");
    });

    it("should apply xl size", () => {
      render(<Dialog {...defaultProps} size="xl" />);
      const dialogContent = screen.getByTestId("dialog-content");
      expect(dialogContent).toHaveClass("max-w-4xl");
    });

    it("should apply full size", () => {
      render(<Dialog {...defaultProps} size="full" />);
      const dialogContent = screen.getByTestId("dialog-content");
      expect(dialogContent).toHaveClass("max-w-full");
    });
  });

  describe("Closing behavior", () => {
    it("should call onClose when close button is clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<Dialog {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByLabelText("Close dialog");
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when Escape key is pressed", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<Dialog {...defaultProps} onClose={onClose} />);

      await user.keyboard("{Escape}");

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when clicking outside the dialog", async () => {
      const onClose = vi.fn();
      render(<Dialog {...defaultProps} onClose={onClose} />);

      const overlay = screen.getByTestId("dialog-overlay");
      expect(overlay).toBeInTheDocument();

      // Simulate mousedown event on the overlay (outside the dialog content)
      const mouseEvent = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
      });
      // Set the target to be the overlay itself
      Object.defineProperty(mouseEvent, "target", {
        value: overlay,
        enumerable: true,
      });
      overlay.dispatchEvent(mouseEvent);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it("should not call onClose when clicking inside the dialog", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(
        <Dialog {...defaultProps} onClose={onClose}>
          <button>Inside button</button>
        </Dialog>
      );

      const insideButton = screen.getByText("Inside button");
      await user.click(insideButton);

      expect(onClose).not.toHaveBeenCalled();
    });

    it("should not close when Escape is pressed and dialog is closed", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<Dialog {...defaultProps} isOpen={false} onClose={onClose} />);

      await user.keyboard("{Escape}");

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("Body scroll lock", () => {
    it("should lock body scroll when dialog is open", () => {
      render(<Dialog {...defaultProps} isOpen={true} />);
      expect(document.body.style.overflow).toBe("hidden");
    });

    it("should unlock body scroll when dialog is closed", () => {
      const { rerender } = render(<Dialog {...defaultProps} isOpen={true} />);
      expect(document.body.style.overflow).toBe("hidden");

      rerender(<Dialog {...defaultProps} isOpen={false} />);
      expect(document.body.style.overflow).toBe("");
    });

    it("should restore body scroll on unmount", () => {
      document.body.style.overflow = "auto";
      const { unmount } = render(<Dialog {...defaultProps} isOpen={true} />);
      expect(document.body.style.overflow).toBe("hidden");

      unmount();
      expect(document.body.style.overflow).toBe("");
    });
  });

  describe("Accessibility", () => {
    it("should have correct ARIA attributes", () => {
      render(<Dialog {...defaultProps} title="Test Dialog" />);
      const dialog = screen.getByRole("dialog");

      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).toHaveAttribute("aria-labelledby", "dialog-title");
    });

    it("should not have aria-labelledby when title is not provided", () => {
      render(<Dialog {...defaultProps} />);
      const dialog = screen.getByRole("dialog");

      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog).not.toHaveAttribute("aria-labelledby");
    });

    it("should have aria-label on close button", () => {
      render(<Dialog {...defaultProps} />);
      const closeButton = screen.getByLabelText("Close dialog");
      expect(closeButton).toHaveAttribute("aria-label", "Close dialog");
    });
  });

  describe("Custom className", () => {
    it("should apply custom className", () => {
      render(<Dialog {...defaultProps} className="custom-class" />);
      const dialogContent = screen.getByTestId("dialog-content");
      expect(dialogContent).toHaveClass("custom-class");
    });
  });

  describe("Event listeners cleanup", () => {
    it("should remove event listeners when dialog closes", async () => {
      const onClose = vi.fn();
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

      const { rerender } = render(
        <Dialog {...defaultProps} isOpen={true} onClose={onClose} />
      );

      // Event listeners should be added
      expect(addEventListenerSpy).toHaveBeenCalled();

      // Close the dialog
      rerender(<Dialog {...defaultProps} isOpen={false} onClose={onClose} />);

      // Event listeners should be removed
      await waitFor(() => {
        expect(removeEventListenerSpy).toHaveBeenCalled();
      });

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });
});
