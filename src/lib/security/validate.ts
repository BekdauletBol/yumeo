/**
 * Input validation utilities to prevent common injection attacks
 */

/**
 * Validate and sanitize user prompt input
 * Prevents prompt injection, excessive length, and null bytes
 */
export function validatePrompt(prompt: string, maxLength = 10000): string {
  if (typeof prompt !== 'string') {
    throw new Error('Prompt must be a string');
  }

  if (prompt.length === 0) {
    throw new Error('Prompt cannot be empty');
  }

  if (prompt.length > maxLength) {
    throw new Error(`Prompt exceeds maximum length of ${maxLength} characters`);
  }

  // Remove null bytes and control characters
  const sanitized = prompt.replace(/[\0\x1F]/g, '');

  // Basic check for common injection patterns (not foolproof, but helps)
  const injectionPatterns = [
    /ignore previous instructions/gi,
    /disregard everything/gi,
    /forget everything/gi,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(sanitized)) {
      throw new Error('Suspicious prompt content detected');
    }
  }

  return sanitized.trim();
}

/**
 * Validate project ID (UUID format)
 */
export function validateProjectId(id: string): string {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(id)) {
    throw new Error('Invalid project ID format');
  }
  return id;
}

/**
 * Validate user ID
 */
export function validateUserId(id: string): string {
  if (!id || id.length === 0 || id.length > 255) {
    throw new Error('Invalid user ID');
  }
  // Allow alphanumeric and common separators
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error('Invalid user ID format');
  }
  return id;
}

/**
 * Validate email address (basic check)
 */
export function validateEmail(email: string): string {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    throw new Error('Invalid email format');
  }
  return email.toLowerCase();
}

/**
 * Validate file upload size
 */
export function validateFileSize(
  bytes: number,
  maxBytes = 10 * 1024 * 1024 // 10MB default
): void {
  if (bytes > maxBytes) {
    throw new Error(`File exceeds maximum size of ${maxBytes / 1024 / 1024}MB`);
  }
}

/**
 * Validate JSON structure
 */
export function validateJSON<T>(
  data: string,
  schema?: (obj: unknown) => obj is T,
): T {
  try {
    const parsed = JSON.parse(data);
    if (schema && !schema(parsed)) {
      throw new Error('JSON does not match expected schema');
    }
    return parsed as T;
  } catch (err) {
    throw new Error(`Invalid JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Rate limit check for repeated failed attempts
 * Call before sending emails, resetting passwords, etc.
 */
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkFailedAttempts(
  identifier: string,
  maxAttempts = 5,
  _windowMs = 15 * 60 * 1000, // 15 minutes
): boolean {
  const now = Date.now();
  const record = failedAttempts.get(identifier);

  if (!record || record.resetAt < now) {
    return true; // Allowed
  }

  return record.count < maxAttempts;
}

export function recordFailedAttempt(
  identifier: string,
  windowMs = 15 * 60 * 1000,
): void {
  const now = Date.now();
  const record = failedAttempts.get(identifier);

  if (!record || record.resetAt < now) {
    failedAttempts.set(identifier, { count: 1, resetAt: now + windowMs });
  } else {
    record.count += 1;
  }
}

export function clearFailedAttempts(identifier: string): void {
  failedAttempts.delete(identifier);
}
