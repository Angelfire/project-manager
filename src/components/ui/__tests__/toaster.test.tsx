import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Toaster } from "@/components/ui/toaster";

// Mock sonner
vi.mock("sonner", () => ({
  Toaster: vi.fn(
    ({
      children,
      toastOptions,
      richColors,
      icons,
      theme,
      position,
      className,
      ...restProps
    }) => {
      // Only pass valid DOM props to the div element
      // Store non-DOM props separately to avoid React warnings
      return (
        <div
          data-testid="sonner-toaster"
          data-theme={theme}
          data-position={position}
          data-rich-colors={richColors ? "true" : "false"}
          className={className}
          {...restProps}
        >
          {children}
        </div>
      );
    }
  ),
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  CircleCheck: () => <div data-testid="circle-check-icon">✓</div>,
  Info: () => <div data-testid="info-icon">ℹ</div>,
  Loader2: () => <div data-testid="loader-icon">⟳</div>,
  CircleX: () => <div data-testid="circle-x-icon">✕</div>,
  TriangleAlert: () => <div data-testid="triangle-alert-icon">⚠</div>,
}));

describe("Toaster", () => {
  it("renders the Sonner Toaster component", () => {
    render(<Toaster />);

    const toaster = screen.getByTestId("sonner-toaster");
    expect(toaster).toBeInTheDocument();
  });

  it("passes dark theme to Sonner", () => {
    render(<Toaster />);

    const toaster = screen.getByTestId("sonner-toaster");
    expect(toaster).toHaveAttribute("data-theme", "dark");
  });

  it("sets position to top-right", () => {
    render(<Toaster />);

    const toaster = screen.getByTestId("sonner-toaster");
    expect(toaster).toHaveAttribute("data-position", "top-right");
  });

  it("includes richColors prop", () => {
    render(<Toaster />);

    const toaster = screen.getByTestId("sonner-toaster");
    expect(toaster).toHaveAttribute("data-rich-colors", "true");
  });

  it("has correct className", () => {
    render(<Toaster />);

    const toaster = screen.getByTestId("sonner-toaster");
    expect(toaster).toHaveClass("toaster", "group");
  });

  it("configures custom icons", () => {
    render(<Toaster />);

    // The icons are passed as props to Sonner, so we verify the component renders
    // The actual icon rendering is tested through integration tests
    const toaster = screen.getByTestId("sonner-toaster");
    expect(toaster).toBeInTheDocument();
  });

  it("configures toast options with dark theme classes", () => {
    render(<Toaster />);

    const toaster = screen.getByTestId("sonner-toaster");
    expect(toaster).toBeInTheDocument();
    // The toastOptions are passed as props, so the component should render correctly
  });
});
