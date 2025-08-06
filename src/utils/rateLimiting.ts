// Enhanced rate limiting utilities with progressive penalties

interface RateLimitEntry {
  count: number;
  timestamp: number;
  violations: number;
  lastViolation: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export const isRateLimited = (
  identifier: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000
): { limited: boolean; retryAfter?: number } => {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  
  if (!entry || now - entry.timestamp > windowMs) {
    // Reset or create new entry
    rateLimitMap.set(identifier, {
      count: 1,
      timestamp: now,
      violations: entry?.violations || 0,
      lastViolation: entry?.lastViolation || 0
    });
    return { limited: false };
  }
  
  // Progressive penalties for repeat offenders
  let adjustedMaxRequests = maxRequests;
  if (entry.violations > 0) {
    const violationPenalty = Math.min(entry.violations * 2, 8);
    adjustedMaxRequests = Math.max(1, maxRequests - violationPenalty);
  }
  
  if (entry.count >= adjustedMaxRequests) {
    // Record violation
    entry.violations++;
    entry.lastViolation = now;
    rateLimitMap.set(identifier, entry);
    
    const retryAfter = Math.ceil((windowMs - (now - entry.timestamp)) / 1000);
    return { limited: true, retryAfter };
  }
  
  // Increment count
  entry.count++;
  rateLimitMap.set(identifier, entry);
  return { limited: false };
};

export const resetRateLimit = (identifier: string): void => {
  rateLimitMap.delete(identifier);
};

export const getRateLimitInfo = (identifier: string): RateLimitEntry | null => {
  return rateLimitMap.get(identifier) || null;
};

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  const cutoff = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now - entry.timestamp > cutoff) {
      rateLimitMap.delete(key);
    }
  }
}, 60 * 60 * 1000); // Run every hour