// Utility to generate password hash for admin login
// This matches the hashing algorithm used in the admin-login function

export const generatePasswordHash = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Example usage:
// generatePasswordHash('admin').then(hash => console.log('Hash for "admin":', hash));
// Hash for "admin": 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918

// For development purposes only - generate hashes as needed
// Never store actual password hashes in production code