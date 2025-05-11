import { useState, useCallback } from "react";

/**
 * Custom hook for handling API errors in components
 * @returns Methods and state for API error handling
 */
export function useApiError() {
  const [error, setError] = useState<string | null>(null);

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Handle an error from an API call or other async operation
   * @param err The error object
   */
  const handleError = useCallback((err: unknown) => {
    console.error("API Error:", err);

    if (err instanceof Error) {
      setError(err.message);
    } else if (typeof err === "string") {
      setError(err);
    } else {
      setError("An unexpected error occurred");
    }
  }, []);

  return {
    error,
    setError,
    clearError,
    handleError,
  };
}

export default useApiError;
