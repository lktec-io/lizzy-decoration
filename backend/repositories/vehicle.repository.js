import { pool } from '../config/db.js';

export async function findByPlate(plateNumber) {
  const [rows] = await pool.query('SELECT * FROM vehicles WHERE plate_number = ? LIMIT 1', [plateNumber]);
  return rows[0] || null;
}

export async function create({ plateNumber, customerName, phone }) {
  const [result] = await pool.query(
    'INSERT INTO vehicles (plate_number, customer_name, phone) VALUES (?, ?, ?)',
    [plateNumber, customerName, phone],
  );
  return { id: result.insertId, plate_number: plateNumber, customer_name: customerName, phone };
}

// A returning vehicle keeps its plate as the stable identity, but the
// customer's name/phone on file is refreshed to whatever was given at this
// visit — cars change hands, and the front desk always has the latest info.
export async function updateContact(id, { customerName, phone }) {
  await pool.query('UPDATE vehicles SET customer_name = ?, phone = ? WHERE id = ?', [customerName, phone, id]);
}
