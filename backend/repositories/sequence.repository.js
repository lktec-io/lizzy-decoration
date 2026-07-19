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
//
// includeYear: false drops the year segment from the visible code (e.g.
// "CUST-0001" instead of "CUST-2026-00001") — used for customers, where a
// year-scoped counter reads as an odd artifact on a code a cashier reads
// aloud to a customer. It keys the counter on a fixed sentinel year (0,
// never a real calendar year) rather than the current year, so the
// sequence never resets on Jan 1 and never repeats a number across years
// the way it would if the real year were used as the DB key but omitted
// from the printed string.
export async function generateCode(documentType, prefix, { padLength = 5, includeYear = true } = {}) {
  const year = includeYear ? new Date().getFullYear() : 0;
  const number = await getNextNumber(documentType, year);
  return includeYear
    ? `${prefix}-${year}-${String(number).padStart(padLength, '0')}`
    : `${prefix}-${String(number).padStart(padLength, '0')}`;
}
