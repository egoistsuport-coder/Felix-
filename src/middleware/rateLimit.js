import { logger } from './logger.js';

// In-memory rate limiter (for simple cases)
// For production, use Redis
const rateLimitStore = new Map();

const RATE_LIMIT_CONFIG = {
  windowMs: 60000, // 1 minute
  maxRequests: 10, // 10 requests per minute
  message: '⏱ Слишком много запросов. Подождите немного.'
};

export async function rateLimit(userId) {
  const now = Date.now();
  const userKey = `user:${userId}`;
  
  // Get user's request history
  let userRequests = rateLimitStore.get(userKey) || [];
  
  // Remove old requests outside the window
  userRequests = userRequests.filter(
    timestamp => now - timestamp < RATE_LIMIT_CONFIG.windowMs
  );
  
  // Check if limit exceeded
  if (userRequests.length >= RATE_LIMIT_CONFIG.maxRequests) {
    logger.warn('Rate limit exceeded', { userId, requests: userRequests.length });
    throw new Error(RATE_LIMIT_CONFIG.message);
  }
  
  // Add current request
  userRequests.push(now);
  rateLimitStore.set(userKey, userRequests);
  
  // Cleanup old entries periodically
  if (Math.random() < 0.01) { // 1% chance
    cleanupOldEntries();
  }
  
  return true;
}

function cleanupOldEntries() {
  const now = Date.now();
  const keysToDelete = [];
  
  for (const [key, requests] of rateLimitStore.entries()) {
    const validRequests = requests.filter(
      timestamp => now - timestamp < RATE_LIMIT_CONFIG.windowMs
    );
    
    if (validRequests.length === 0) {
      keysToDelete.push(key);
    } else {
      rateLimitStore.set(key, validRequests);
    }
  }
  
  keysToDelete.forEach(key => rateLimitStore.delete(key));
  
  if (keysToDelete.length > 0) {
    logger.info('Cleaned up rate limit store', { deletedKeys: keysToDelete.length });
  }
}

// Redis-based rate limiter (for production)
export async function rateLimitRedis(userId, redis) {
  const key = `ratelimit:${userId}`;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_CONFIG.windowMs;
  
  // Remove old entries
  await redis.zremrangebyscore(key, 0, windowStart);
  
  // Count requests in current window
  const requestCount = await redis.zcard(key);
  
  if (requestCount >= RATE_LIMIT_CONFIG.maxRequests) {
    logger.warn('Rate limit exceeded (Redis)', { userId, requests: requestCount });
    throw new Error(RATE_LIMIT_CONFIG.message);
  }
  
  // Add current request
  await redis.zadd(key, now, `${now}-${Math.random()}`);
  
  // Set expiry
  await redis.expire(key, Math.ceil(RATE_LIMIT_CONFIG.windowMs / 1000));
  
  return true;
}
