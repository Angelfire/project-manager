import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toastError } from "@/utils/toast";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Show toast notification
    toastError(
      "An unexpected error occurred",
      error.message || "Please try refreshing the application"
    );

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-6 text-destructive" />
              <h1 className="text-xl font-semibold text-foreground">
                Something went wrong
              </h1>
            </div>

            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                An unexpected error occurred in the application. You can try to
                recover by resetting the error boundary or reloading the page.
              </p>

              {this.state.error && (
                <details className="mt-4">
                  <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                    Error details
                  </summary>
                  <div className="mt-2 p-3 bg-background border border-border rounded text-xs font-mono text-destructive overflow-auto max-h-32">
                    <div className="font-semibold mb-1">
                      {this.state.error.name}
                    </div>
                    <div>{this.state.error.message}</div>
                    {this.state.errorInfo && (
                      <div className="mt-2 text-muted-foreground">
                        {this.state.errorInfo.componentStack}
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={this.handleReset}
                variant="primary"
                className="flex-1"
              >
                <RefreshCw className="size-4 mr-2" />
                Try again
              </Button>
              <Button
                onClick={this.handleReload}
                variant="secondary"
                className="flex-1"
              >
                <Home className="size-4 mr-2" />
                Reload app
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
