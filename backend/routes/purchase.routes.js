import { Router } from 'express';
import * as purchaseController from '../controllers/purchase.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { createSpreadsheetUploader } from '../middlewares/upload.js';
import { createPurchaseValidator, paymentValidator, commitImportValidator } from '../validators/purchase.validator.js';

const router = Router();
const spreadsheetUploader = createSpreadsheetUploader();

router.use(authenticate, authorize('purchases.view'));

router.get('/', purchaseController.list);
router.get('/import/template', authorize('purchases.create'), purchaseController.downloadImportTemplate);
router.post('/import/preview', authorize('purchases.create'), spreadsheetUploader.single('file'), purchaseController.previewImport);
router.post('/import/commit', authorize('purchases.create'), commitImportValidator, validateRequest, purchaseController.commitImport);
router.get('/:id', purchaseController.getById);
router.post('/', authorize('purchases.create'), createPurchaseValidator, validateRequest, purchaseController.create);
router.post('/payments', authorize('purchases.manage'), paymentValidator, validateRequest, purchaseController.addPayment);

export default router;
