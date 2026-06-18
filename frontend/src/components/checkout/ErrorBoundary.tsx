"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class CheckoutErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught checkout payment error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="w-full bg-red-50 border border-red-200 rounded-2xl p-6 text-center font-sans">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Payment Gateway Error</h3>
          <p className="text-sm text-red-600 mb-4">
            We failed to load the secure payment gateway. This can happen if Stripe script is blocked by an extension, or you are offline.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-lg transition-colors"
          >
            Retry Loading
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
