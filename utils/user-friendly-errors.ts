/**
 * Converts technical error messages to user-friendly messages
 */

interface ErrorMapping {
  pattern: RegExp;
  message: string;
  suggestion?: string;
}

const errorMappings: ErrorMapping[] = [
  // Network errors
  {
    pattern: /network|fetch|connection|timeout/i,
    message: "We're having trouble connecting to our servers.",
    suggestion: "Please check your internet connection and try again."
  },
  {
    pattern: /aborted|cancelled/i,
    message: "The request was cancelled.",
    suggestion: "Please try again."
  },
  
  // Authentication errors
  {
    pattern: /unauthorized|401/i,
    message: "You need to sign in to continue.",
    suggestion: "Please sign in and try again."
  },
  {
    pattern: /forbidden|403/i,
    message: "You don't have permission to do that.",
    suggestion: "Please contact support if you believe this is an error."
  },
  
  // Server errors
  {
    pattern: /500|internal server error/i,
    message: "Something went wrong on our end.",
    suggestion: "We've been notified and are working on it. Please try again in a few moments."
  },
  {
    pattern: /503|service unavailable/i,
    message: "Our service is temporarily unavailable.",
    suggestion: "Please try again in a few minutes."
  },
  
  // Validation errors
  {
    pattern: /validation|invalid|required/i,
    message: "Please check your information and try again.",
    suggestion: "Make sure all required fields are filled out correctly."
  },
  
  // Rate limiting
  {
    pattern: /rate limit|too many requests|429/i,
    message: "You're making requests too quickly.",
    suggestion: "Please wait a moment and try again."
  },
  
  // Generic fallbacks
  {
    pattern: /failed|error/i,
    message: "Something went wrong.",
    suggestion: "Please try again. If the problem persists, contact support."
  }
];

export function getUserFriendlyError(error: string | Error | unknown): {
  message: string;
  suggestion?: string;
} {
  const errorString = error instanceof Error ? error.message : String(error);
  
  if (!errorString) {
    return {
      message: "Something went wrong. Please try again.",
      suggestion: "If the problem persists, please contact support."
    };
  }
  
  // Check for exact matches first
  for (const mapping of errorMappings) {
    if (mapping.pattern.test(errorString)) {
      return {
        message: mapping.message,
        suggestion: mapping.suggestion
      };
    }
  }
  
  // If no match found, return a generic friendly message
  return {
    message: "Something went wrong. Please try again.",
    suggestion: "If the problem persists, please contact support at (901) 410-2020."
  };
}

export function formatErrorForDisplay(error: string | Error | unknown): string {
  const { message, suggestion } = getUserFriendlyError(error);
  return suggestion ? `${message} ${suggestion}` : message;
}

