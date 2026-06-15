"use client";

import { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary - catches rendering errors in child components and shows
 * a fallback UI instead of crashing the entire page.
 *
 * WHY class component: React error boundaries can only be implemented as
 * class components - there's no hook equivalent for componentDidCatch.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="h-12 w-12 rounded-lg bg-error-bg flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-error-text" />
          </div>
          <h3 className="text-base font-semibold text-text-primary">Something went wrong</h3>
          <p className="text-sm text-text-muted max-w-xs">
            An unexpected error occurred. Please try refreshing.
          </p>
          <button
            onClick={this.handleRetry}
            className="mt-2 inline-flex items-center gap-1.5 h-7 rounded-md bg-brand px-3 text-xs font-medium text-white hover:bg-brand/90 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
