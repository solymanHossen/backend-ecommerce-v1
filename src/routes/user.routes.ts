import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { getUserProfile, updateUserProfile, deleteUser } from '../controllers/user.controller';
import { validateUpdateUser } from '../validators/user.validator';

const router = express.Router();

router.get('/profile', authMiddleware, getUserProfile);
router.put('/profile', authMiddleware, validateUpdateUser, updateUserProfile);
router.delete('/profile', authMiddleware, deleteUser);

export default router;