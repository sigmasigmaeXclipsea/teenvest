/**
 * Sanitizes error messages to prevent exposing internal implementation details.
 * Maps known error types to user-friendly messages.
 */
export const getUserFriendlyError = (error: Error | unknown): string => {
  const message = error instanceof Error ? error.message : String(error);
  
  // Map specific known errors to user-friendly messages
  if (message.includes('Insufficient funds')) {
    return 'Not enough cash available for this trade.';
  }
  if (message.includes('Insufficient shares')) {
    return "You don't own enough shares to sell.";
  }
  if (message.includes('Not authenticated')) {
    return 'Please log in to continue.';
  }
  if (message.includes('fetch') || message.includes('network') || message.includes('Failed to fetch')) {
    return 'Unable to connect. Please check your internet connection.';
  }
  if (message.includes('Unable to fetch stock data') || message.includes('stock')) {
    return 'Unable to get stock information. Please try again.';
  }
  if (message.includes('Invalid symbol format')) {
    return 'Invalid symbol format. Use 1-5 letters (e.g., AAPL, TSLA).';
  }
  if (message.includes('Rate limit')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  if (message.includes('timeout') || message.includes('Timeout')) {
    return 'Request timed out. Please try again.';
  }
  
  // For any other error, return a generic message
  // Log the full error for debugging (only in development)
  if (import.meta.env.DEV) {
    console.error('Unhandled error:', message);
  }
  
  return 'An error occurred. Please try again.';
};

/**
 * Safe toast description - ensures no internal details are exposed
 */
export const getSafeToastDescription = (error: Error | unknown): string => {
  return getUserFriendlyError(error);
};
