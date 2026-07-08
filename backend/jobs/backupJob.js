import cron from 'node-cron';
import { logger } from '../config/logger.js';
import * as backupService from '../services/backup.service.js';

const DAILY_AT_2AM = '0 2 * * *';

// Runs once a day, independent of the manual "Run Backup Now" trigger in
// Settings — same underlying createBackup(), just triggeredBy: null and
// trigger_type: 'scheduled' so the history in Settings > Backups can tell
// the two apart. A failure here is logged, never thrown — a scheduled job
// has no request to return an error to.
export function scheduleDailyBackup() {
  cron.schedule(DAILY_AT_2AM, async () => {
    try {
      await backupService.createBackup(null, 'scheduled');
      logger.info('Scheduled daily backup completed');
    } catch (err) {
      logger.error('Scheduled daily backup failed', { message: err.message });
    }
  });
}
