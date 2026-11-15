import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import healthRouter from './routes/health.js';
import aiRouter from './routes/ai.js';
import remindersRouter from './routes/reminders.js';
import careRouter from './routes/care.js';
import { securityHeaders, rateLimiter } from './middleware/security.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Security Hardening: Disable information disclosure
app.disable('x-powered-by');

// Security & Protection Middlewares
app.use(securityHeaders);
app.use(cors());
app.use(rateLimiter);

// Payload limiting to prevent DoS attacks
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Request logging for observability
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// API Routes
app.use('/api/health', healthRouter);
app.use('/api/ai', aiRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/care', careRouter);

// Serve static frontend assets when in production
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// For SPA routing, serve index.html for non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      // In development, Vite server serves index.html, return informative message
      res.status(200).send(`
        CareCompass Backend API is running on port ${PORT}.
        Run Vite dev server via 'npm run client' to preview the frontend.
      `);
    }
  });
});

// Graceful error handler
app.use((err, req, res, next) => {
  console.error('[CareCompass Uncaught Error]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// Start listener only when not running in test mode
let server = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`=================================================`);
    console.log(`CareCompass Platform running on port ${PORT}`);
    console.log(`Health endpoint: http://localhost:${PORT}/api/health`);
    console.log(`Cloud Run Environment: ${Boolean(process.env.K_SERVICE) ? 'Active' : 'Local'}`);
    console.log(`=================================================`);
  });

  // Graceful shutdown handlers for Google Cloud Run
  const handleShutdown = (signal) => {
    console.log(`Received ${signal}. Shutting down CareCompass server gracefully...`);
    server.close(() => {
      console.log('Server closed successfully.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

export default app;
