// Secure IP handling utilities - replaces client-side user ID generation

export const generateSecureUserId = (): string => {
  // Generate a more secure user identifier that's harder to manipulate
  const timestamp = Date.now();
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  const randomHex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return `user_${timestamp}_${randomHex}`;
};

export const getOrCreateSecureUserId = (): string => {
  const storageKey = 'pixperiment_secure_user_id';
  let userId = localStorage.getItem(storageKey);
  
  if (!userId) {
    userId = generateSecureUserId();
    localStorage.setItem(storageKey, userId);
  }
  
  return userId;
};

// Validate that a user ID follows the expected format
export const validateUserId = (userId: string): boolean => {
  const pattern = /^user_\d+_[a-f0-9]{32}$/;
  return pattern.test(userId);
};

// Generate a session-based identifier that changes on browser restart
export const getSessionUserId = (): string => {
  const sessionKey = 'pixperiment_session_user_id';
  let sessionId = sessionStorage.getItem(sessionKey);
  
  if (!sessionId) {
    sessionId = generateSecureUserId();
    sessionStorage.setItem(sessionKey, sessionId);
  }
  
  return sessionId;
};