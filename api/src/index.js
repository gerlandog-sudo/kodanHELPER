import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import { config } from './config.js';
import { ingestRouter } from './routes/ingest.js';

const logger = pino({ transport: { target: 'pino-pretty' } });

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.cors.origin }));
  app.use(express.json({ limit: '50mb' }));

  // Request logging
  app.use((req, res, next) => {
    logger.info({ method: req.method, url: req.url }, 'request');
    next();
  });

  // Routes
  app.use('/api/ingest', ingestRouter);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    logger.error({ err }, 'unhandled error');
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

// Only start listening when run directly (not when imported for tests)
const isMainModule = process.argv[1] && 
  (process.argv[1].endsWith('index.js') || process.argv[1].endsWith('index'));

if (isMainModule) {
  const app = createApp();
  app.listen(config.port, () => {
    logger.info(`API listening on port ${config.port}`);
  });
}
