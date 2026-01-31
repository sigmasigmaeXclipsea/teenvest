/**
 * Sanitizes error messages to prevent exposing internal implementation details.
 * Maps known error types to user-friendly messages.
 */
const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (typeof error === 'number' || typeof error === 'boolean' || typeof error === 'bigint') {
    return String(error);
  }
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const directMessage = record.message;
    if (typeof directMessage === 'string' && directMessage.trim()) return directMessage;
    const errorField = record.error;
    if (typeof errorField === 'string' && errorField.trim()) return errorField;
    if (errorField && typeof errorField === 'object') {
      const nestedMessage = (errorField as Record<string, unknown>).message;
      if (typeof nestedMessage === 'string' && nestedMessage.trim()) return nestedMessage;
    }
    const errorDescription = record.error_description;
    if (typeof errorDescription === 'string' && errorDescription.trim()) return errorDescription;
    const details = record.details;
    if (typeof details === 'string' && details.trim()) return details;
    const hint = record.hint;
    if (typeof hint === 'string' && hint.trim()) return hint;
    const statusText = record.statusText;
    if (typeof statusText === 'string' && statusText.trim()) return statusText;
    const code = record.code;
    if (typeof code === 'string' && code.trim()) return code;
    const name = record.name;
    if (typeof name === 'string' && name.trim()) return name;
    try {
      return JSON.stringify(record);
    } catch {
      return 'Unknown error';
    }
  }
  return 'Unknown error';
};

export const getUserFriendlyError = (error: Error | unknown): string => {
  const message = extractErrorMessage(error);
  
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
  if (message.includes('Unauthorized') || message.includes('JWT')) {
    return 'Your session expired. Please log in again.';
  }
  if (message.includes('function execute_trade') || message.includes('function place_order')) {
    return 'Trading service is out of date. Please refresh after applying the latest migrations.';
  }
  if (message.includes('Failed to send a request to the Edge Function') || message.includes('Edge Function')) {
    return 'AI service is unreachable. Ensure Supabase edge functions are running and deployed.';
  }
  if (message.includes('Portfolio not found')) {
    return 'Your portfolio is missing. Please log out and back in.';
  }
  if (message.includes('Cannot buy while short')) {
    return 'You are currently short. Use Cover to close the short position.';
  }
  if (message.includes('Close long position before shorting')) {
    return 'Close your long position before opening a short.';
  }
  if (message.includes('No short position found')) {
    return 'No short position found to cover.';
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
  if (message.includes('Invalid price')) {
    return 'Invalid price received. Please try again.';
  }
  if (message.includes('Invalid shares')) {
    return 'Invalid share amount. Please enter a positive number.';
  }
  if (message.includes('Invalid order type')) {
    return 'Invalid order type selected.';
  }
  if (message.includes('Invalid trade type')) {
    return 'Invalid trade type selected.';
  }
  if (message.includes('Invalid company name')) {
    return 'Stock data is missing a company name.';
  }
  if (message.includes('Invalid order price')) {
    return 'Order price is invalid. Please check your inputs.';
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
    console.error('Unhandled error:', error);
    return message || 'An error occurred. Please try again.';
  }
  
  return 'An error occurred. Please try again.';
};

/**
 * Safe toast description - ensures no internal details are exposed
 */
export const getSafeToastDescription = (error: Error | unknown): string => {
  return getUserFriendlyError(error);
};
