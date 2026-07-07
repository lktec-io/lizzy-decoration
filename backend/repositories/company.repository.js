import { pool } from '../config/db.js';

export async function get() {
  const [rows] = await pool.query('SELECT * FROM company_settings ORDER BY id ASC LIMIT 1');
  return rows[0] || null;
}

export async function insert(data) {
  const [result] = await pool.query(
    `INSERT INTO company_settings
      (company_name, business_type, tin_number, vrn, registration_number, address, region, district, street,
       phone, alt_phone, email, website, logo_path, currency, timezone, receipt_footer, description, status,
       created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.companyName, data.businessType, data.tinNumber, data.vrn, data.registrationNumber,
      data.address, data.region, data.district, data.street,
      data.phone, data.altPhone, data.email, data.website, data.logoPath,
      data.currency, data.timezone, data.receiptFooter, data.description, data.status,
      data.userId, data.userId,
    ],
  );
  return findById(result.insertId);
}

export async function update(id, data) {
  await pool.query(
    `UPDATE company_settings SET
       company_name = ?, business_type = ?, tin_number = ?, vrn = ?, registration_number = ?,
       address = ?, region = ?, district = ?, street = ?,
       phone = ?, alt_phone = ?, email = ?, website = ?, currency = ?, timezone = ?,
       receipt_footer = ?, description = ?, status = ?, updated_by = ?
     WHERE id = ?`,
    [
      data.companyName, data.businessType, data.tinNumber, data.vrn, data.registrationNumber,
      data.address, data.region, data.district, data.street,
      data.phone, data.altPhone, data.email, data.website, data.currency, data.timezone,
      data.receiptFooter, data.description, data.status, data.userId,
      id,
    ],
  );
  return findById(id);
}

export async function updateLogoPath(id, logoPath) {
  await pool.query('UPDATE company_settings SET logo_path = ? WHERE id = ?', [logoPath, id]);
  return findById(id);
}

export async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM company_settings WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}
