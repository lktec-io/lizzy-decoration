import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { loginValidator, forgotPasswordValidator, resetPasswordValidator } from '../validators/auth.validator.js';

const router = Router();

router.post('/login', authLimiter, loginValidator, validateRequest, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validateRequest, authController.forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidator, validateRequest, authController.resetPassword);
router.get('/me', authenticate, authController.me);
router.get('/sessions', authenticate, authController.sessions);
router.delete('/sessions/:id', authenticate, authController.revokeSession);

export default router;
