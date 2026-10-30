/**
 * In-Memory Sliding Window Rate Limiter
 * Protects streaming and search endpoints from abuse.
 */

function createRateLimiter({ windowMs = 60 * 1000, max = 60, message = 'Too many requests, please try again later.' } = {}) {
  const requests = new Map();

  // Periodic cleanup every 2 minutes to prevent memory leaks
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter((time) => now - time < windowMs);
      if (validTimestamps.length === 0) {
        requests.delete(ip);
      } else {
        requests.set(ip, validTimestamps);
      }
    }
  }, 2 * 60 * 1000);

  // Prevent interval from holding node process open in tests
  if (interval.unref) {
    interval.unref();
  }

  return function rateLimiter(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const now = Date.now();

    const clientRequests = requests.get(ip) || [];
    const validRequests = clientRequests.filter((time) => now - time < windowMs);

    if (validRequests.length >= max) {
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      return res.status(429).json({
        error: 'Too Many Requests',
        message,
        retryAfterSeconds: Math.ceil(windowMs / 1000),
      });
    }

    validRequests.push(now);
    requests.set(ip, validRequests);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - validRequests.length));

    next();
  };
}

module.exports = {
  createRateLimiter,
};
