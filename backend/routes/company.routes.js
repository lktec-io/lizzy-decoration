import { Router } from 'express';
import * as companyController from '../controllers/company.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { upsertCompanyValidator } from '../validators/company.validator.js';
import { createUploader } from '../middlewares/upload.js';

const router = Router();
const logoUploader = createUploader({ subfolder: 'logo', cloudinaryFolder: 'company', maxSizeMb: 2 });

// Public: the login page (pre-authentication) needs the company name/logo too.
// This is a single-tenant internal system — there is exactly one company's
// own public-facing profile here, not another tenant's private data.
router.get('/', companyController.getCompany);

router.put('/', authenticate, authorize('company.manage'), upsertCompanyValidator, validateRequest, companyController.updateCompany);
router.post('/logo', authenticate, authorize('company.manage'), logoUploader.single('logo'), companyController.uploadLogo);

export default router;
