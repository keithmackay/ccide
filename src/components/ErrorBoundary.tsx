import React, { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error details for debugging
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    this.setState({
      error,
      errorInfo,
    });

    // Filter out errors from browser extensions or external scripts
    const isExternalError =
      error.stack?.includes('container.js') ||
      error.stack?.includes('chrome-extension://') ||
      error.stack?.includes('moz-extension://') ||
      error.message?.includes('merchantID');

    if (isExternalError) {
      console.warn('[ErrorBoundary] External error detected (likely from browser extension), suppressing...');
      // Don't show error UI for external errors
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  override render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
          <div className="w-full max-w-2xl p-8 bg-gray-800 rounded-lg shadow-2xl border border-red-500">
            {/* Error Icon */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600/20">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
                <p className="text-sm text-gray-400">An unexpected error occurred</p>
              </div>
            </div>

            {/* Error Message */}
            <div className="mb-6 p-4 bg-gray-900 rounded-md border border-gray-700">
              <h2 className="text-sm font-semibold text-red-400 mb-2">Error Message:</h2>
              <p className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                {this.state.error.message}
              </p>
            </div>

            {/* Error Stack */}
            {this.state.error.stack && (
              <div className="mb-6 p-4 bg-gray-900 rounded-md border border-gray-700 max-h-64 overflow-y-auto">
                <h2 className="text-sm font-semibold text-red-400 mb-2">Stack Trace:</h2>
                <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Reload Page
              </button>
            </div>

            {/* Help Text */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-xs text-gray-500">
                If this error persists, please check the browser console (F12) for more details
                or try disabling browser extensions that might interfere with the application.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
