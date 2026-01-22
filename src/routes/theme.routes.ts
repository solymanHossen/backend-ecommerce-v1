import express from 'express';
import {
  getAllThemes,
  getThemeByName,
  createTheme,
  updateTheme,
  deleteTheme,
  getActiveTheme,
  setActiveTheme
} from '../controllers/theme.controller';
import {
  validateCreateTheme,
  validateUpdateTheme,
  validateSetActiveTheme,
  validateThemeName
} from '../validators/theme.validator';
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Public routes (anyone can view themes)
router.get('/', getAllThemes);
router.get('/active', getActiveTheme);
router.get('/:name', validateThemeName, getThemeByName);

// SECURITY FIX: Protected routes - ADMIN ONLY
router.post('/', authMiddleware, adminMiddleware, validateCreateTheme, createTheme);
router.put('/:name', authMiddleware, adminMiddleware, validateUpdateTheme, updateTheme);
router.delete('/:name', authMiddleware, adminMiddleware, validateThemeName, deleteTheme);
router.post('/active', authMiddleware, adminMiddleware, validateSetActiveTheme, setActiveTheme);

export default router;
