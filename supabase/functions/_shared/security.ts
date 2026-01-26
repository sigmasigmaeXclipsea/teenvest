// Simple in-memory rate limiter for Deno Deploy (per-instance)
// For production, consider using Redis or a distributed store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 30 }
): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const key = identifier;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // First request or window expired
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, resetTime: now + config.windowMs };
  }

  if (record.count >= config.maxRequests) {
    return { allowed: false, resetTime: record.resetTime };
  }

  record.count += 1;
  return { allowed: true, resetTime: record.resetTime };
}

// Simple CSRF token validation for state-changing requests
// In production, use a more robust CSRF library
export function validateCSRFToken(req: Request, token: string): boolean {
  const headerToken = req.headers.get('X-CSRF-Token');
  return headerToken === token;
}

// Generate a simple CSRF token (for demo purposes)
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Content Security Policy headers
export const cspHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// Sanitize user input to prevent XSS
export function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .slice(0, 1000); // Limit length
}
