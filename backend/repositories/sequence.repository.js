import { pool } from '../config/db.js';

// Atomic named counter using MySQL's LAST_INSERT_ID(expr) idiom — works
// correctly under concurrent callers without an explicit transaction/lock,
// and works on both the first-ever call for a (documentType, year) pair
// (the INSERT branch) and every call after (the ON DUPLICATE KEY UPDATE
// branch), since LAST_INSERT_ID() is forced on both branches explicitly.
async function getNextNumber(documentType, year) {
  const [result] = await pool.query(
    `INSERT INTO document_sequences (document_type, year, last_number)
     VALUES (?, ?, LAST_INSERT_ID(1))
     ON DUPLICATE KEY UPDATE last_number = LAST_INSERT_ID(last_number + 1)`,
    [documentType, year],
  );
  return result.insertId;
}

// e.g. generateCode('PRODUCT_CRT', 'CRT') -> "CRT-2026-00001"
export async function generateCode(documentType, prefix, { padLength = 5 } = {}) {
  const year = new Date().getFullYear();
  const number = await getNextNumber(documentType, year);
  return `${prefix}-${year}-${String(number).padStart(padLength, '0')}`;
}
