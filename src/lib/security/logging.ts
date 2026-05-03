/**
 * Structured logging for security events and operations
 * Enables audit trails and suspicious activity detection
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
export type EventType = 
  | 'auth.login'
  | 'auth.logout'
  | 'auth.failed'
  | 'auth.password_reset'
  | 'api.rate_limit'
  | 'api.unauthorized'
  | 'api.error'
  | 'data.created'
  | 'data.updated'
  | 'data.deleted'
  | 'security.threat'
  | 'security.misconfiguration'
  | 'payment.created'
  | 'payment.failed';

interface SecurityLog {
  level: LogLevel;
  eventType: EventType;
  userId?: string;
  projectId?: string;
  ipAddress?: string;
  userAgent?: string;
  message: string;
  metadata?: Record<string, unknown>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  timestamp?: string;
}

/**
 * Extract client IP from request (accounting for proxies)
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',');
    return (ips[0] ?? 'unknown').trim();
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Log security event
 */
export function logSecurityEvent(log: SecurityLog): void {
  const sanitizedLog = {
    ...log,
    timestamp: new Date().toISOString(),
  };

  // Always log to console in development
  if (process.env.NODE_ENV === 'development') {
    const color = {
      debug: '\x1b[36m',
      info: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      critical: '\x1b[41m',
    };
    const reset = '\x1b[0m';
    console.log(
      `${color[log.level]}[${log.eventType}]${reset}`,
      JSON.stringify(sanitizedLog, null, 2),
    );
  }

  // In production, send to external logging service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to Sentry, DataDog, CloudWatch, etc.
    // Example: sendToCloudWatch(sanitizedLog);
    // Example: sendToSentry(sanitizedLog);
  }

  // Alert on critical events
  if (log.level === 'critical') {
    console.error('🚨 CRITICAL SECURITY EVENT:', sanitizedLog);
    // TODO: Send alert to security team
  }
}

/**
 * Log authentication attempt
 */
export function logAuthAttempt(
  userId: string,
  success: boolean,
  ipAddress: string,
  userAgent?: string,
  reason?: string,
): void {
  logSecurityEvent({
    level: success ? 'info' : 'warn',
    eventType: success ? 'auth.login' : 'auth.failed',
    userId,
    ipAddress,
    userAgent,
    message: success ? `User logged in` : `Authentication failed: ${reason}`,
    severity: success ? 'low' : 'high',
  });
}

/**
 * Log API rate limit hit
 */
export function logRateLimit(
  userId: string,
  endpoint: string,
  ipAddress: string,
): void {
  logSecurityEvent({
    level: 'warn',
    eventType: 'api.rate_limit',
    userId,
    ipAddress,
    message: `Rate limit exceeded on ${endpoint}`,
    severity: 'medium',
    metadata: { endpoint },
  });
}

/**
 * Log unauthorized access attempt
 */
export function logUnauthorized(
  endpoint: string,
  ipAddress: string,
  reason: string,
): void {
  logSecurityEvent({
    level: 'warn',
    eventType: 'api.unauthorized',
    ipAddress,
    message: `Unauthorized access attempt: ${reason}`,
    severity: 'high',
    metadata: { endpoint },
  });
}

/**
 * Log security threat
 */
export function logSecurityThreat(
  threatType: string,
  ipAddress: string,
  userAgent?: string,
  details?: string,
): void {
  logSecurityEvent({
    level: 'critical',
    eventType: 'security.threat',
    ipAddress,
    userAgent,
    message: `Security threat detected: ${threatType}`,
    severity: 'critical',
    metadata: { threatType, details },
  });
}

/**
 * Log data operation
 */
export function logDataOperation(
  operation: 'created' | 'updated' | 'deleted',
  userId: string,
  projectId: string,
  resourceType: string,
  resourceId: string,
): void {
  logSecurityEvent({
    level: 'info',
    eventType: `data.${operation}`,
    userId,
    projectId,
    message: `${resourceType} ${operation}: ${resourceId}`,
    severity: 'low',
    metadata: { resourceType, resourceId },
  });
}

/**
 * Log payment event
 */
export function logPaymentEvent(
  success: boolean,
  userId: string,
  amount: number,
  currency: string,
  transactionId: string,
): void {
  logSecurityEvent({
    level: success ? 'info' : 'error',
    eventType: success ? 'payment.created' : 'payment.failed',
    userId,
    message: success
      ? `Payment processed: ${amount} ${currency}`
      : `Payment failed: ${transactionId}`,
    severity: success ? 'low' : 'high',
    metadata: { amount, currency, transactionId },
  });
}
