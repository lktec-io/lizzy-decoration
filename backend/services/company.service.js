import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { ApiError } from '../utils/apiError.js';
import * as companyRepository from '../repositories/company.repository.js';
import * as activityLogRepository from '../repositories/activityLog.repository.js';
import { publicPathFor } from '../middlewares/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

export async function getProfile() {
  return companyRepository.get();
}

export async function upsertProfile(data, userId) {
  const existing = await companyRepository.get();

  const payload = {
    companyName: data.companyName,
    businessType: data.businessType || null,
    tinNumber: data.tinNumber || null,
    vrn: data.vrn || null,
    registrationNumber: data.registrationNumber || null,
    address: data.address || null,
    region: data.region || null,
    district: data.district || null,
    street: data.street || null,
    phone: data.phone || null,
    altPhone: data.altPhone || null,
    email: data.email || null,
    website: data.website || null,
    currency: data.currency || 'TZS',
    timezone: data.timezone || 'Africa/Dar_es_Salaam',
    receiptFooter: data.receiptFooter || null,
    description: data.description || null,
    status: data.status || 'active',
    userId,
  };

  if (!existing) {
    return companyRepository.insert({ ...payload, logoPath: null });
  }

  return companyRepository.update(existing.id, payload);
}

export async function updateLogo(file, userId) {
  const existing = await companyRepository.get();
  if (!existing) {
    throw new ApiError(400, 'Create the company profile before uploading a logo');
  }

  const logoPath = publicPathFor('logo', file.filename);
  const updated = await companyRepository.updateLogoPath(existing.id, logoPath);

  if (existing.logo_path) {
    const oldFilePath = path.join(UPLOADS_ROOT, existing.logo_path.replace('/uploads/', ''));
    fs.unlink(oldFilePath).catch(() => {
      // Old file already gone or inaccessible — not fatal.
    });
  }

  await activityLogRepository.create({
    userId,
    branchId: null,
    description: 'Company logo updated',
    referenceType: 'company_settings',
    referenceId: existing.id,
  });

  return updated;
}
