import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import * as qrCodeController from '../controllers/qrCode.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { createUploader } from '../middlewares/upload.js';
import { productValidator, bulkStatusValidator } from '../validators/product.validator.js';

const router = Router();
const productImageUploader = createUploader({ subfolder: 'products', maxSizeMb: 3 });

router.use(authenticate);

router.get('/', authorize('products.view'), productController.list);
router.get('/:id', authorize('products.view'), productController.getById);
router.post('/', authorize('products.create'), productValidator, validateRequest, productController.create);
router.put('/:id', authorize('products.edit'), productValidator, validateRequest, productController.update);
router.patch('/bulk-status', authorize('products.manage'), bulkStatusValidator, validateRequest, productController.bulkStatus);
router.delete('/:id', authorize('products.delete'), productController.remove);
router.post('/:id/images', authorize('products.edit'), productImageUploader.single('image'), productController.uploadImage);
router.delete('/:id/images/:imageId', authorize('products.edit'), productController.removeImage);
router.get('/:id/qr', authorize('products.view'), qrCodeController.getForProduct);
router.post('/:id/qr/regenerate', authorize('products.manage'), qrCodeController.regenerate);

export default router;
