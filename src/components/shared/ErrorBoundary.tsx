'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Log to error reporting service (e.g., Sentry)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">
              Oops! Something went wrong
            </h1>

            {/* Description */}
            <p className="text-center text-gray-600 mb-6">
              We encountered an unexpected error. Don't worry, our team has been notified
              and we're working on it.
            </p>

            {/* Error Details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Error Details (Development Only)
                </h3>
                <p className="text-sm text-red-600 font-mono mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-700 cursor-pointer hover:text-gray-900">
                      Component Stack
                    </summary>
                    <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-64 p-2 bg-white rounded">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                className="flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="flex items-center justify-center"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
            </div>

            {/* Help Text */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                If the problem persists, please{' '}
                <a
                  href="/contact"
                  className="text-purple-600 hover:text-purple-700 underline"
                >
                  contact support
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Async Error Boundary for handling async errors
export function AsyncErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
