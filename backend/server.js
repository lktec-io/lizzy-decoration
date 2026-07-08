import app from './app.js';
import { env } from './config/env.js';
import { testConnection } from './config/db.js';
import { logger } from './config/logger.js';
import { scheduleDailyBackup } from './jobs/backupJob.js';

async function start() {
  try {
    await testConnection();
    logger.info('Database connection established');

    app.listen(env.port, () => {
      logger.info(`JOZZY ERP API listening on port ${env.port} [${env.nodeEnv}]`);
    });

    scheduleDailyBackup();
  } catch (err) {
    logger.error('Failed to start server', { message: err.message });
    process.exit(1);
  }
}

start();
