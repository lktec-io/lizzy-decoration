import { env } from './env.js';

const DEV_ORIGIN = 'http://localhost:5173';

// FRONTEND_URL (from .env) is always allowed — it's the production origin
// in a production .env, or a local dev origin in a dev .env. The dev
// origin is additionally allowed whenever NODE_ENV isn't production, so a
// single production .env doesn't need a second variable just to also allow
// local development against the same API.
const allowedOrigins = env.isProduction ? [env.frontendUrl] : [...new Set([env.frontendUrl, DEV_ORIGIN])];

export const corsOptions = {
  origin(origin, callback) {
    // No Origin header — same-origin requests, curl, server-to-server. Allow.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
