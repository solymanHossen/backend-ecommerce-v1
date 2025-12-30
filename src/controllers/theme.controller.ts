import { Request, Response } from 'express';
import { ThemeService } from '../services/theme.service';
import logger from '../utils/logger';
import sendResponse from '../utils/response';

export const getAllThemes = async (req: Request, res: Response): Promise<void> => {
  try {
    const themes = await ThemeService.getAllThemes();
    sendResponse(res, 200, true, 'Themes fetched successfully', { themes });
  } catch (error: any) {
    logger.error(error);
    sendResponse(res, 500, false, error.message);
  }
};

export const getThemeByName = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.params;
    const theme = await ThemeService.getThemeByName(name);

    if (!theme) {
      sendResponse(res, 404, false, 'Theme not found');
      return;
    }

    sendResponse(res, 200, true, 'Theme fetched successfully', { theme });
  } catch (error: any) {
    logger.error(error);
    sendResponse(res, 500, false, error.message);
  }
};

export const createTheme = async (req: Request, res: Response): Promise<void> => {
  try {
    const themeData = req.body;
    const theme = await ThemeService.createTheme(themeData);
    sendResponse(res, 201, true, 'Theme created successfully', { theme });
  } catch (error: any) {
    logger.error(error);
    const statusCode = error.message.includes('already exists') ? 400 : 500;
    sendResponse(res, statusCode, false, error.message);
  }
};

export const updateTheme = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.params;
    const themeData = req.body;
    const theme = await ThemeService.updateTheme(name, themeData);

    if (!theme) {
      sendResponse(res, 404, false, 'Theme not found');
      return;
    }

    sendResponse(res, 200, true, 'Theme updated successfully', { theme });
  } catch (error: any) {
    logger.error(error);
    sendResponse(res, 500, false, error.message);
  }
};

export const deleteTheme = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.params;
    await ThemeService.deleteTheme(name);
    sendResponse(res, 200, true, 'Theme deleted successfully');
  } catch (error: any) {
    logger.error(error);
    const statusCode = error.message.includes('Cannot delete') ? 400 : 500;
    sendResponse(res, statusCode, false, error.message);
  }
};

export const getActiveTheme = async (req: Request, res: Response): Promise<void> => {
  try {
    const activeTheme = await ThemeService.getActiveTheme();
    sendResponse(res, 200, true, 'Active theme fetched successfully', activeTheme);
  } catch (error: any) {
    logger.error(error);
    sendResponse(res, 500, false, error.message);
  }
};

export const setActiveTheme = async (req: Request, res: Response): Promise<void> => {
  try {
    const { theme, isDark } = req.body;

    if (!theme) {
      sendResponse(res, 400, false, 'Theme name is required');
      return;
    }

    const setting = await ThemeService.setActiveTheme(theme, isDark || false);
    sendResponse(res, 200, true, 'Active theme updated successfully', {
      theme: setting.theme,
      isDark: setting.isDark
    });
  } catch (error: any) {
    logger.error(error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    sendResponse(res, statusCode, false, error.message);
  }
};
