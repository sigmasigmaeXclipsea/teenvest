// Enhanced security utilities for edge functions

// ====== RATE LIMITING ======
// Dual-layer rate limiting: per-user and per-IP
const userRateLimitStore = new Map<string, { count: number; resetTime: number }>();
const ipRateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of userRateLimitStore.entries()) {
    if (now > record.resetTime) userRateLimitStore.delete(key);
  }
  for (const [key, record] of ipRateLimitStore.entries()) {
    if (now > record.resetTime) ipRateLimitStore.delete(key);
  }
}, 60000);

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  resetTime?: number;
  remaining?: number;
}

// Standard rate limiting by identifier (user ID)
export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 30 }
): RateLimitResult {
  const now = Date.now();
  const record = userRateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    userRateLimitStore.set(identifier, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, resetTime: now + config.windowMs, remaining: config.maxRequests - 1 };
  }

  if (record.count >= config.maxRequests) {
    return { allowed: false, resetTime: record.resetTime, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, resetTime: record.resetTime, remaining: config.maxRequests - record.count };
}

// IP-based rate limiting for anonymous/public endpoints
export function rateLimitByIP(
  req: Request,
  config: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 30 }
): RateLimitResult {
  const ip = extractClientIP(req);
  const now = Date.now();
  const record = ipRateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    ipRateLimitStore.set(ip, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, resetTime: now + config.windowMs, remaining: config.maxRequests - 1 };
  }

  if (record.count >= config.maxRequests) {
    return { allowed: false, resetTime: record.resetTime, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, resetTime: record.resetTime, remaining: config.maxRequests - record.count };
}

// Extract client IP from request headers
export function extractClientIP(req: Request): string {
  // Check common proxy headers
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP in the chain (original client)
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = req.headers.get('x-real-ip');
  if (realIP) return realIP.trim();
  
  const cfIP = req.headers.get('cf-connecting-ip');
  if (cfIP) return cfIP.trim();
  
  // Fallback to a hash if no IP available
  return 'unknown-client';
}

// ====== INPUT VALIDATION ======

// Sanitize user input to prevent XSS
export function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 2000); // Limit length
}

// Validate stock symbol format
export function validateSymbol(symbol: unknown): string | null {
  if (typeof symbol !== 'string') return null;
  const clean = symbol.trim().toUpperCase();
  if (!/^[A-Z]{1,5}$/.test(clean)) return null;
  return clean;
}

// Validate positive number within range
export function validateNumber(
  value: unknown,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER
): number | null {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num) || num < min || num > max) return null;
  return num;
}

// ====== SECURITY HEADERS ======

// Content Security Policy and security headers
export const cspHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// Standard CORS headers with security enhancements
export const secureCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token, x-request-id',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  ...cspHeaders,
};

// ====== CSRF PROTECTION ======

// Simple CSRF token validation for state-changing requests
export function validateCSRFToken(req: Request, token: string): boolean {
  const headerToken = req.headers.get('X-CSRF-Token');
  return headerToken === token;
}

// Generate a secure CSRF token
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// ====== REQUEST VALIDATION ======

// Validate request body size
export async function validateRequestSize(req: Request, maxBytes: number = 10240): Promise<boolean> {
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > maxBytes) {
    return false;
  }
  return true;
}

// Create rate limit response with headers
export function createRateLimitResponse(resetTime: number): Response {
  return new Response(
    JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
    {
      status: 429,
      headers: {
        ...secureCorsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
        'X-RateLimit-Reset': resetTime.toString(),
      },
    }
  );
}

// Create error response
export function createErrorResponse(message: string, status: number = 500): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: {
        ...secureCorsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

// Create success response
export function createSuccessResponse(data: unknown): Response {
  return new Response(
    JSON.stringify(data),
    {
      headers: {
        ...secureCorsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}
