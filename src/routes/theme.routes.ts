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
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Public routes (anyone can view themes)
router.get('/', getAllThemes);
router.get('/active', getActiveTheme);
router.get('/:name', validateThemeName, getThemeByName);

// Protected routes (authentication required)
router.post('/', authMiddleware, validateCreateTheme, createTheme);
router.put('/:name', authMiddleware, validateUpdateTheme, updateTheme);
router.delete('/:name', authMiddleware, validateThemeName, deleteTheme);
router.post('/active', authMiddleware, validateSetActiveTheme, setActiveTheme);

export default router;
