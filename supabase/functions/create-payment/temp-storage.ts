// Temporary in-memory storage for image data during payment flow
// In production, you'd want to use Redis or similar
const tempImageStorage = new Map<string, any>();

export function storeImageData(sessionId: string, imageData: any) {
  tempImageStorage.set(sessionId, {
    data: imageData,
    timestamp: Date.now()
  });
  
  // Clean up after 1 hour
  setTimeout(() => {
    tempImageStorage.delete(sessionId);
  }, 60 * 60 * 1000);
}

export function getImageData(sessionId: string) {
  const stored = tempImageStorage.get(sessionId);
  if (stored && Date.now() - stored.timestamp < 60 * 60 * 1000) {
    return stored.data;
  }
  tempImageStorage.delete(sessionId);
  return null;
}