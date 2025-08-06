
export class InputValidator {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 320;
  }

  static validateIpAddress(ip: string): boolean {
    // IPv4 regex
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    // IPv6 regex (simplified)
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  static validateUserAgent(userAgent: string): boolean {
    // Basic validation - not empty, reasonable length, contains common browser indicators
    if (!userAgent || userAgent.length > 2048 || userAgent.length < 10) {
      return false;
    }
    
    // Check for common SQL injection patterns
    const sqlPatterns = /(\b(union|select|insert|update|delete|drop|exec|script)\b)/i;
    if (sqlPatterns.test(userAgent)) {
      return false;
    }

    return true;
  }

  static sanitizeString(input: string, maxLength: number = 1000): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .replace(/[<>'"]/g, '') // Remove potential XSS characters
      .trim()
      .substring(0, maxLength);
  }

  static validatePrice(price: number): boolean {
    return Number.isInteger(price) && price >= 1 && price <= 1000000; // $10,000 max
  }

  static validateUploadId(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  static validateSessionToken(token: string): boolean {
    // Session tokens should be at least 32 characters and alphanumeric
    return /^[a-zA-Z0-9]{32,}$/.test(token);
  }
}
