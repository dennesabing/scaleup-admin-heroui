import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryClass extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      // Check if the error is related to authentication
      const isAuthError =
        this.state.error?.message?.includes("Invalid email or password") ||
        this.state.error?.message?.includes("authentication") ||
        this.state.error?.message?.includes("auth");

      // If we're on an auth page, don't show the error boundary
      // This will let the page's own error handling take care of it
      if (window.location.pathname.includes("/auth/") && isAuthError) {
        return this.props.children;
      }

      // Otherwise, show the error fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary p-4 rounded-md bg-red-50 text-red-800">
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="mb-4">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper with router access
export const ErrorBoundary = (props: Props): JSX.Element => {
  return <ErrorBoundaryClass {...props} />;
};

export default ErrorBoundary;
