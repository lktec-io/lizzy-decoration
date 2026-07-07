import { pool } from '../config/db.js';

export async function findByProductId(productId) {
  const [rows] = await pool.query('SELECT * FROM qr_codes WHERE product_id = ? LIMIT 1', [productId]);
  return rows[0] || null;
}

export async function upsert(productId, qrPath, payload) {
  const existing = await findByProductId(productId);

  if (existing) {
    await pool.query(
      'UPDATE qr_codes SET qr_path = ?, payload = ?, regenerated_count = regenerated_count + 1 WHERE id = ?',
      [qrPath, JSON.stringify(payload), existing.id],
    );
    return findByProductId(productId);
  }

  await pool.query(
    'INSERT INTO qr_codes (product_id, qr_path, payload, regenerated_count) VALUES (?, ?, ?, 0)',
    [productId, qrPath, JSON.stringify(payload)],
  );
  return findByProductId(productId);
}
