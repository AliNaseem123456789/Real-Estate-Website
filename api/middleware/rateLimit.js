import { createError } from "../utils/createError.js";

// Very small in-memory rate limiter, e.g. rateLimit(5, 10) = 5 requests per 10 minutes per IP.
// Good enough for one server; it resets when the server restarts.
export const rateLimit = (maxRequests, minutes) => {
  const hits = new Map(); // ip -> list of timestamps

  return (req, res, next) => {
    const now = Date.now();
    const windowStart = now - minutes * 60 * 1000;
    const recent = (hits.get(req.ip) || []).filter((time) => time > windowStart);

    if (recent.length >= maxRequests) {
      return next(createError(429, "Too many requests, please try again later"));
    }
    recent.push(now);
    hits.set(req.ip, recent);
    next();
  };
};
