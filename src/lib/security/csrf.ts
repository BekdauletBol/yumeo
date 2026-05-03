import crypto from 'crypto';
import { cookies } from 'next/headers';

const CSRF_TOKEN_NAME = 'x-csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a CSRF token and store it in a secure, httpOnly cookie
 */
export async function generateCSRFToken(): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const cookieStore = await cookies();
  
  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600, // 1 hour
    path: '/',
  });

  return token;
}

/**
 * Verify CSRF token from request headers
 * Call this in POST/PUT/DELETE handlers
 */
export async function verifyCSRFToken(token?: string): Promise<boolean> {
  if (!token) return false;

  const cookieStore = await cookies();
  const storedToken = cookieStore.get(CSRF_TOKEN_NAME)?.value;

  if (!storedToken) return false;

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(storedToken)
  );
}

/**
 * Middleware helper to validate CSRF on state-changing requests
 */
export async function validateCSRF(request: Request): Promise<boolean> {
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    return true; // Skip CSRF for GET/HEAD/OPTIONS
  }

  const token = request.headers.get(CSRF_HEADER_NAME);
  return verifyCSRFToken(token || undefined);
}
