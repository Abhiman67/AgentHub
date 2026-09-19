"use client";

import React, { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallbackTitle?: string;
};

type State = {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
};

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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    if (process.env.NODE_ENV !== "production") {
      console.error("ErrorBoundary caught an unhandled client error:", error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto my-8 max-w-xl p-6">
          <div className="rounded-3xl border border-rose-500/20 bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <span className="text-xl">⚠️</span>
              <h2 className="text-lg font-bold">
                {this.props.fallbackTitle ?? "Something went wrong in this workspace view"}
              </h2>
            </div>

            <p className="mt-2 text-xs text-muted leading-relaxed">
              An unexpected render error occurred. Your study data, files, and project progress remain safe on the server.
            </p>

            {this.state.error && (
              <div className="mt-4 rounded-xl border border-line bg-neutral-100/60 dark:bg-neutral-900/60 p-3 font-mono text-[11px] text-muted overflow-x-auto max-h-32">
                <span className="font-semibold text-rose-500">{this.state.error.name}:</span>{" "}
                {this.state.error.message}
              </div>
            )}

            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={this.resetError}
                className="rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-xl border border-line bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
