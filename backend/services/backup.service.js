import { spawn } from 'child_process';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import * as backupRepository from '../repositories/backup.repository.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Deliberately NOT under backend/uploads — that directory is served
// statically at /uploads (see app.js), and a full database dump must never
// be publicly reachable. Backups are only ever accessed through the
// authenticated, permission-gated download endpoint below.
const BACKUPS_DIR = path.join(__dirname, '..', 'backups');

function runMysqldump(destinationPath) {
  return new Promise((resolve, reject) => {
    const args = ['-h', env.db.host, '-P', String(env.db.port), '-u', env.db.user, env.db.database];
    // spawn (not exec/shell) so config values never pass through a shell —
    // no injection surface, and the password goes via env, never argv.
    const child = spawn('mysqldump', args, { env: { ...process.env, MYSQL_PWD: env.db.password } });

    const out = fs.createWriteStream(destinationPath);
    child.stdout.pipe(out);

    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `mysqldump exited with code ${code}`));
    });
  });
}

export async function listBackups(query) {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const { rows, total } = await backupRepository.findAll({ page, limit });
  return { items: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function createBackup(actorId) {
  await fsPromises.mkdir(BACKUPS_DIR, { recursive: true });
  const filename = `backup-${env.db.database}-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
  const filePath = path.join(BACKUPS_DIR, filename);

  try {
    await runMysqldump(filePath);
    const stats = await fsPromises.stat(filePath);
    const id = await backupRepository.create({
      filePath: filename, sizeBytes: stats.size, triggerType: 'manual', status: 'success', triggeredBy: actorId,
    });
    return backupRepository.findById(id);
  } catch {
    await backupRepository.create({
      filePath: filename, sizeBytes: null, triggerType: 'manual', status: 'failed', triggeredBy: actorId,
    });
    throw new ApiError(
      500,
      'Backup failed. Confirm the mysqldump binary is installed and reachable on this server, and that the database credentials in .env are correct.',
    );
  }
}

export async function getBackupFilePath(id) {
  const backup = await backupRepository.findById(id);
  if (!backup || backup.status !== 'success') throw new ApiError(404, 'Backup not found');
  return { filePath: path.join(BACKUPS_DIR, backup.file_path), filename: backup.file_path };
}
