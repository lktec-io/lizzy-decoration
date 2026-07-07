import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { createUploader } from '../middlewares/upload.js';
import {
  createUserValidator,
  updateUserValidator,
  changeStatusValidator,
  resetPasswordValidator,
} from '../validators/user.validator.js';

const router = Router();
const avatarUploader = createUploader({ subfolder: 'avatars', maxSizeMb: 2 });

router.use(authenticate);

router.get('/', authorize('users.view'), userController.list);
router.get('/:id', authorize('users.view'), userController.getById);
router.post('/', authorize('users.create'), createUserValidator, validateRequest, userController.create);
router.put('/:id', authorize('users.edit'), updateUserValidator, validateRequest, userController.update);
router.patch('/:id/status', authorize('users.edit'), changeStatusValidator, validateRequest, userController.changeStatus);
router.patch('/:id/password', authorize('users.edit'), resetPasswordValidator, validateRequest, userController.resetPassword);
router.delete('/:id', authorize('users.delete'), userController.remove);
router.post('/:id/avatar', authorize('users.edit'), avatarUploader.single('avatar'), userController.uploadAvatar);

export default router;
