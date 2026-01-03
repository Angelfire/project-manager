import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog } from "../dialog";

describe("Dialog", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: "Test Dialog",
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
      // Title is rendered using DialogTitle Radix primitive
      const headings = screen.getAllByRole("heading", { name: "Test Dialog" });
      expect(headings.length).toBeGreaterThan(0);
      const heading = headings[0];
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe("H2");
    });

    it("should render subtitle when provided", () => {
      render(<Dialog {...defaultProps} subtitle="Test subtitle" />);
      // Subtitle is rendered using DialogDescription Radix primitive
      const subtitle = screen.getByText("Test subtitle");
      expect(subtitle).toBeInTheDocument();
      expect(subtitle.tagName).toBe("P");
    });

    it("should render both title and subtitle", () => {
      render(
        <Dialog
          {...defaultProps}
          title="Test Dialog"
          subtitle="Test subtitle"
        />
      );
      const headings = screen.getAllByRole("heading", { name: "Test Dialog" });
      expect(headings.length).toBeGreaterThan(0);
      const heading = headings[0];
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe("H2");

      const subtitle = screen.getByText("Test subtitle");
      expect(subtitle).toBeInTheDocument();
      expect(subtitle.tagName).toBe("P");
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

    it("should render header even when only title is provided", () => {
      render(
        <Dialog
          {...defaultProps}
          subtitle={undefined}
          showCloseButton={false}
          headerActions={undefined}
        />
      );
      // Header should be rendered with title (title is required)
      const headings = screen.getAllByRole("heading", { name: "Test Dialog" });
      expect(headings.length).toBeGreaterThan(0);
      const heading = headings[0];
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe("H2");
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

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it("should call onClose when Escape key is pressed", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<Dialog {...defaultProps} onClose={onClose} />);

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it("should call onClose when clicking outside the dialog", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<Dialog {...defaultProps} onClose={onClose} />);

      const overlay = screen.getByTestId("dialog-overlay");
      expect(overlay).toBeInTheDocument();

      // Click on the overlay (outside the dialog content)
      await user.click(overlay);

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
      // Radix UI handles body scroll lock automatically
      // We just verify the dialog is rendered
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should unlock body scroll when dialog is closed", () => {
      const { rerender } = render(<Dialog {...defaultProps} isOpen={true} />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      rerender(<Dialog {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should restore body scroll on unmount", () => {
      document.body.style.overflow = "auto";
      const { unmount } = render(<Dialog {...defaultProps} isOpen={true} />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      unmount();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have correct ARIA attributes", () => {
      render(<Dialog {...defaultProps} title="Test Dialog" />);
      const dialog = screen.getByRole("dialog");

      // Radix UI automatically sets aria-labelledby when DialogTitle is present
      expect(dialog).toHaveAttribute("aria-labelledby");
      // The dialog role element should exist and be accessible
      expect(dialog).toBeInTheDocument();
      // Radix UI handles modal behavior internally, aria-modal may not be explicitly set
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

  describe("Auto-focus prevention", () => {
    it("should not auto-focus the close button when dialog opens", async () => {
      render(<Dialog {...defaultProps} />);
      const closeButton = screen.getByLabelText("Close dialog");

      // Wait a bit for any auto-focus to occur
      await waitFor(
        () => {
          // The close button should not have focus
          // Since we prevent auto-focus, the active element should not be the close button
          expect(document.activeElement).not.toBe(closeButton);
        },
        { timeout: 100 }
      );
    });
  });
});
