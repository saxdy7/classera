import crypto from 'crypto';

/**
 * Generate a secure test session token
 * Format: classera_test_[timestamp]_[random32bytes]_[hash]
 */
export function generateTestSessionToken(): string {
  const prefix = 'classera_test';
  const timestamp = Date.now().toString(36);
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const combined = `${prefix}_${timestamp}_${randomBytes}`;
  const hash = crypto
    .createHash('sha256')
    .update(combined)
    .digest('hex')
    .substring(0, 16);

  return `${combined}_${hash}`;
}

/**
 * Generate browser fingerprint from user agent
 */
export function generateBrowserFingerprint(userAgent: string): string {
  return crypto
    .createHash('sha256')
    .update(userAgent)
    .digest('hex')
    .substring(0, 32);
}

/**
 * Validate test session token format and integrity
 */
export function validateTestSessionToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  if (!token.startsWith('classera_test_')) return false;

  const parts = token.split('_');
  if (parts.length < 5) return false;

  // Extract hash from token
  const providedHash = parts[parts.length - 1];
  const tokenWithoutHash = parts.slice(0, -1).join('_');

  // Recalculate hash
  const calculatedHash = crypto
    .createHash('sha256')
    .update(tokenWithoutHash)
    .digest('hex')
    .substring(0, 16);

  return providedHash === calculatedHash;
}

/**
 * Generate submission hash for integrity verification
 */
export function generateSubmissionHash(answers: Record<string, any>, testId: string, studentId: string): string {
  const dataToHash = JSON.stringify({
    answers,
    testId,
    studentId,
    timestamp: Math.floor(Date.now() / 1000), // Round to nearest second
  });

  return crypto
    .createHash('sha256')
    .update(dataToHash)
    .digest('hex');
}

/**
 * Encrypt sensitive submission data
 */
export function encryptSubmissionData(data: any, encryptionKey: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto
    .createHash('sha256')
    .update(encryptionKey)
    .digest();

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), 'utf8'),
    cipher.final(),
  ]);

  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt submission data
 */
export function decryptSubmissionData(encryptedData: string, encryptionKey: string): any {
  const [ivHex, encryptedHex] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  const key = crypto
    .createHash('sha256')
    .update(encryptionKey)
    .digest();

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString('utf8'));
}

/**
 * Validate IP address (basic check)
 */
export function validateIPAddress(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i;

  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.').map(Number);
    return parts.every((part) => part >= 0 && part <= 255);
  }

  return ipv6Regex.test(ip);
}

/**
 * Extract client IP from request headers
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const xRealIP = request.headers.get('x-real-ip');
  if (xRealIP) {
    return xRealIP;
  }

  // Fallback to connecting IP if available
  const remoteAddr = request.headers.get('cf-connecting-ip');
  return remoteAddr || 'unknown';
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Calculate test session expiry time
 */
export function calculateSessionExpiry(durationMinutes: number): Date {
  // Add 5 minutes buffer for grace period
  const bufferMinutes = 5;
  const totalMinutes = durationMinutes + bufferMinutes;
  return new Date(Date.now() + totalMinutes * 60 * 1000);
}

/**
 * Check if session has expired
 */
export function isSessionExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Calculate remaining time in seconds
 */
export function getRemainingSeconds(expiresAt: Date): number {
  const remaining = expiresAt.getTime() - Date.now();
  return Math.max(0, Math.floor(remaining / 1000));
}

/**
 * Validate test submission timing
 * Ensures submission is within allowed time window
 */
export function validateSubmissionTiming(
  testStartedAt: Date,
  durationMinutes: number,
  submittedAt: Date = new Date()
): {
  isValid: boolean;
  reason?: string;
  timeTakenMinutes: number;
} {
  const timeTakenMs = submittedAt.getTime() - testStartedAt.getTime();
  const timeTakenMinutes = timeTakenMs / (1000 * 60);

  // Allow 5 minute grace period after test duration
  const maxAllowedMinutes = durationMinutes + 5;

  if (timeTakenMinutes > maxAllowedMinutes) {
    return {
      isValid: false,
      reason: `Test submission exceeded allowed time (${timeTakenMinutes.toFixed(2)} > ${maxAllowedMinutes})`,
      timeTakenMinutes,
    };
  }

  return {
    isValid: true,
    timeTakenMinutes,
  };
}

/**
 * Detect suspicious activity patterns
 */
export function detectSuspiciousActivity(violations: {
  tabSwitches?: number;
  fullscreenExits?: number;
  copyPasteAttempts?: number;
  faceDetectionFailures?: number;
  screenShareStops?: number;
  suspiciousEvents?: number;
}): {
  isSuspicious: boolean;
  riskScore: number; // 0-100
  reasons: string[];
} {
  let riskScore = 0;
  const reasons: string[] = [];

  const thresholds = {
    tabSwitches: 10,
    fullscreenExits: 5,
    copyPasteAttempts: 15,
    faceDetectionFailures: 10,
    screenShareStops: 3,
  };

  if (violations.tabSwitches && violations.tabSwitches > thresholds.tabSwitches) {
    riskScore += 15;
    reasons.push(`Excessive tab switches: ${violations.tabSwitches}`);
  }

  if (violations.fullscreenExits && violations.fullscreenExits > thresholds.fullscreenExits) {
    riskScore += 20;
    reasons.push(`Excessive fullscreen exits: ${violations.fullscreenExits}`);
  }

  if (violations.copyPasteAttempts && violations.copyPasteAttempts > thresholds.copyPasteAttempts) {
    riskScore += 25;
    reasons.push(`Excessive copy/paste attempts: ${violations.copyPasteAttempts}`);
  }

  if (violations.faceDetectionFailures && violations.faceDetectionFailures > thresholds.faceDetectionFailures) {
    riskScore += 30;
    reasons.push(`Excessive face detection failures: ${violations.faceDetectionFailures}`);
  }

  if (violations.screenShareStops && violations.screenShareStops > thresholds.screenShareStops) {
    riskScore += 20;
    reasons.push(`Excessive screen share stops: ${violations.screenShareStops}`);
  }

  if (violations.suspiciousEvents && violations.suspiciousEvents > 0) {
    riskScore += violations.suspiciousEvents * 5;
    reasons.push(`Suspicious events detected: ${violations.suspiciousEvents}`);
  }

  return {
    isSuspicious: riskScore > 50,
    riskScore: Math.min(100, riskScore),
    reasons,
  };
}

/**
 * Rate limiting check for test submissions
 */
export function checkSubmissionRateLimit(
  lastSubmissionTime: Date | null,
  minIntervalSeconds: number = 30
): {
  isAllowed: boolean;
  reason?: string;
  secondsUntilAllowed?: number;
} {
  if (!lastSubmissionTime) {
    return { isAllowed: true };
  }

  const secondsSinceLastSubmission = (Date.now() - lastSubmissionTime.getTime()) / 1000;

  if (secondsSinceLastSubmission < minIntervalSeconds) {
    return {
      isAllowed: false,
      reason: 'Too many submission attempts',
      secondsUntilAllowed: Math.ceil(minIntervalSeconds - secondsSinceLastSubmission),
    };
  }

  return { isAllowed: true };
}
