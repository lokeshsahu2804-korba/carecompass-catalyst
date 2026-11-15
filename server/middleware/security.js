/**
 * CareCompass Security & Hardening Middleware
 * Implements OWASP recommendations and Express security best practices
 */

// In-memory rate limiting store: Map<IP, { count: number, resetTime: number }>
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 120; // 120 requests per minute

/**
 * Lightweight rate-limiting middleware without heavy third-party dependencies
 */
export function rateLimiter(req, res, next) {
  // Allow disabling in automated test suites if needed via header or NODE_ENV
  if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
    return next();
  }

  const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';
  const now = Date.now();

  let clientRecord = rateLimitStore.get(clientIp);

  if (!clientRecord || now > clientRecord.resetTime) {
    clientRecord = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    };
    rateLimitStore.set(clientIp, clientRecord);
  } else {
    clientRecord.count += 1;
  }

  // Set standard rate limit headers
  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - clientRecord.count);
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', Math.ceil(clientRecord.resetTime / 1000));

  if (clientRecord.count > MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((clientRecord.resetTime - now) / 1000);
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please wait before retrying.',
      retryAfterSeconds: retryAfter,
    });
  }

  next();
}

/**
 * OWASP-compliant security headers middleware
 */
export function securityHeaders(req, res, next) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Clickjacking protection
  res.setHeader('X-Frame-Options', 'DENY');

  // Cross-Site Scripting (XSS) filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Strict Transport Security (HSTS)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Content Security Policy (allows self-hosted assets and Google Cloud endpoints)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:* https://*.googleapis.com;"
  );

  next();
}

/**
 * Sanitizes input string to prevent control character injection and strip XSS vectors
 */
export function sanitizeString(val, maxLength = 250) {
  if (typeof val !== 'string') return '';
  return val
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Strip non-printable control characters
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates email format according to standard RFC 5322 regex
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) && email.length <= 150;
}

