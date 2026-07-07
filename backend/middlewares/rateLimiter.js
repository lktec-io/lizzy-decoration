import rateLimit from 'express-rate-limit';
import { failure } from '../utils/apiResponse.js';

function limiterHandler(req, res) {
  return failure(res, { message: 'Too many requests, please try again later', status: 429 });
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limiterHandler,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limiterHandler,
});
