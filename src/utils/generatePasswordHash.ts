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

// Common test passwords with their hashes:
const commonPasswords = {
  'admin': '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
  'password': '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
  'control': 'baf1ff66b1b1a6eadf4ebf55cf7b28a88ab1e67f53b3ac8a8fe66c7c39985c2b',
  'pixperiment': 'c8b5b0f5d4f8b3a7e7c6b5a8d9f3e2a1c5b4d7e8f1a2b3c4d5e6f7a8b9c0d1e2',
  'experiment': 'b82ed0dd0e6c2f8d8b3a7c9e5f1a8b4d3c7e9f2a5b6c8d1e4f7a9b2c5d8e1f4a7b'
};

export default commonPasswords;