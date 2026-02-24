/**
 * CORS Configuration
 *
 * Configures Cross-Origin Resource Sharing for client-server communication.
 * Allows the Angular frontend to communicate with the Express API.
 */

import { CorsOptions } from 'cors';

const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:4200',
  // Add production origins when deployed
  ...(process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',') || []
    : []),
];

export const corsOptions: CorsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list
    if (
      allowedOrigins.indexOf(origin) !== -1 ||
      process.env.NODE_ENV === 'development'
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Correlation-ID',
    'Accept',
    'X-Requested-With',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Size', 'X-Correlation-ID'],
  maxAge: 86400,
};

export default corsOptions;
