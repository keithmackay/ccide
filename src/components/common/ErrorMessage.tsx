/**
 * ErrorMessage Component - Reusable error display with action suggestions
 * Provides user-friendly error messages with contextual actions
 */

import React from 'react';
import { AlertCircle, RefreshCw, Settings, Clock, XCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Error types that can be handled by this component
 */
export type ErrorType =
  | 'api_key'
  | 'rate_limit'
  | 'network'
  | 'token_limit'
  | 'model_not_found'
  | 'timeout'
  | 'decryption'
  | 'unknown';

/**
 * Error message configuration
 */
export interface ErrorMessageConfig {
  type: ErrorType;
  message: string;
  details?: string;
  retry?: () => void;
  navigateToSettings?: () => void;
}

/**
 * Get user-friendly error information based on error type
 */
function getErrorInfo(type: ErrorType): {
  icon: React.ReactNode;
  title: string;
  suggestion: string;
  actionLabel?: string;
} {
  switch (type) {
    case 'api_key':
      return {
        icon: <Settings className="w-5 h-5" />,
        title: 'Invalid API Key',
        suggestion: 'Please check your API key in Settings. Make sure it\'s correctly configured for the selected provider.',
        actionLabel: 'Open Settings',
      };

    case 'rate_limit':
      return {
        icon: <Clock className="w-5 h-5" />,
        title: 'Rate Limit Exceeded',
        suggestion: 'You\'ve reached the API rate limit. Please wait a moment before trying again.',
        actionLabel: 'Retry',
      };

    case 'network':
      return {
        icon: <AlertCircle className="w-5 h-5" />,
        title: 'Connection Error',
        suggestion: 'Unable to connect to the API. Please check your internet connection and try again.',
        actionLabel: 'Retry',
      };

    case 'token_limit':
      return {
        icon: <XCircle className="w-5 h-5" />,
        title: 'Token Limit Exceeded',
        suggestion: 'Your message is too long. Try shortening it or splitting it into multiple messages.',
      };

    case 'model_not_found':
      return {
        icon: <AlertCircle className="w-5 h-5" />,
        title: 'Model Not Available',
        suggestion: 'The selected model is not available. Please choose a different model in Settings.',
        actionLabel: 'Open Settings',
      };

    case 'timeout':
      return {
        icon: <Clock className="w-5 h-5" />,
        title: 'Request Timeout',
        suggestion: 'The request took too long to complete. Please try again with a shorter message.',
        actionLabel: 'Retry',
      };

    case 'decryption':
      return {
        icon: <AlertCircle className="w-5 h-5" />,
        title: 'Decryption Failed',
        suggestion: 'Unable to decrypt settings. Please check your password and try again.',
        actionLabel: 'Open Settings',
      };

    default:
      return {
        icon: <AlertCircle className="w-5 h-5" />,
        title: 'An Error Occurred',
        suggestion: 'Something went wrong. Please try again or contact support if the issue persists.',
        actionLabel: 'Retry',
      };
  }
}

/**
 * Parse error from API response or exception
 */
export function parseError(error: any): ErrorMessageConfig {
  const errorMessage = error?.message || String(error);
  const errorLower = errorMessage.toLowerCase();

  // API Key errors
  if (errorLower.includes('api key') || errorLower.includes('unauthorized') || errorLower.includes('401')) {
    return {
      type: 'api_key',
      message: errorMessage,
      details: 'Authentication failed. Please verify your API key.',
    };
  }

  // Rate limiting
  if (errorLower.includes('rate limit') || errorLower.includes('429') || errorLower.includes('too many requests')) {
    return {
      type: 'rate_limit',
      message: errorMessage,
      details: 'API rate limit exceeded. Please wait before making another request.',
    };
  }

  // Network errors
  if (
    errorLower.includes('network') ||
    errorLower.includes('fetch') ||
    errorLower.includes('connection') ||
    errorLower.includes('offline')
  ) {
    return {
      type: 'network',
      message: errorMessage,
      details: 'Network connection failed. Check your internet connection.',
    };
  }

  // Token limit
  if (errorLower.includes('token') && (errorLower.includes('limit') || errorLower.includes('maximum'))) {
    return {
      type: 'token_limit',
      message: errorMessage,
      details: 'Message exceeds token limit. Try reducing the message length.',
    };
  }

  // Model not found
  if (errorLower.includes('model') && errorLower.includes('not found')) {
    return {
      type: 'model_not_found',
      message: errorMessage,
      details: 'The requested model is not available.',
    };
  }

  // Timeout
  if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
    return {
      type: 'timeout',
      message: errorMessage,
      details: 'Request timed out. Try again with a shorter message.',
    };
  }

  // Decryption
  if (errorLower.includes('decrypt')) {
    return {
      type: 'decryption',
      message: errorMessage,
      details: 'Failed to decrypt settings. Check your password.',
    };
  }

  // Unknown error
  return {
    type: 'unknown',
    message: errorMessage,
    details: 'An unexpected error occurred.',
  };
}

/**
 * ErrorMessage Component Props
 */
export interface ErrorMessageProps {
  config: ErrorMessageConfig;
  onDismiss?: () => void;
  className?: string;
}

/**
 * ErrorMessage Component
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  config,
  onDismiss,
  className,
}) => {
  const errorInfo = getErrorInfo(config.type);

  return (
    <div
      className={cn(
        'bg-red-900/20 border border-red-800 rounded-lg p-4',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="text-red-400 mt-0.5">{errorInfo.icon}</div>

        <div className="flex-1 min-w-0">
          <h3 className="text-red-300 font-semibold text-sm mb-1">
            {errorInfo.title}
          </h3>
          <p className="text-red-200/80 text-sm mb-2">{errorInfo.suggestion}</p>

          {config.details && (
            <div className="bg-red-950/50 rounded px-3 py-2 mt-2">
              <p className="text-xs text-red-300/70 font-mono break-all">
                {config.details}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            {config.retry && errorInfo.actionLabel === 'Retry' && (
              <button
                onClick={config.retry}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-sm rounded transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            )}

            {config.navigateToSettings && errorInfo.actionLabel === 'Open Settings' && (
              <button
                onClick={config.navigateToSettings}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-sm rounded transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            )}

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-3 py-1.5 text-red-300 hover:text-white text-sm rounded transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Inline error display (smaller variant)
 */
export const InlineError: React.FC<{
  message: string;
  className?: string;
}> = ({ message, className }) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-red-400 text-sm px-3 py-2 bg-red-900/20 rounded',
        className
      )}
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};
