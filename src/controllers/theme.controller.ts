import { Request, Response } from 'express';
import { ThemeService } from '../services/theme.service';
import sendResponse from '../utils/response';
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";

export const getAllThemes = asyncHandler(async (req: Request, res: Response) => {
    const themes = await ThemeService.getAllThemes();
    sendResponse(res, 200, true, 'Themes fetched successfully', { themes });
});

export const getThemeByName = asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.params;
    const theme = await ThemeService.getThemeByName(name);

    if (!theme) {
        throw new AppError('Theme not found', 404);
    }

    sendResponse(res, 200, true, 'Theme fetched successfully', { theme });
});

export const createTheme = asyncHandler(async (req: Request, res: Response) => {
    const themeData = req.body;
    const theme = await ThemeService.createTheme(themeData);
    sendResponse(res, 201, true, 'Theme created successfully', { theme });
});

export const updateTheme = asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.params;
    const themeData = req.body;
    const theme = await ThemeService.updateTheme(name, themeData);

    if (!theme) {
        throw new AppError('Theme not found', 404);
    }

    sendResponse(res, 200, true, 'Theme updated successfully', { theme });
});

export const deleteTheme = asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.params;
    await ThemeService.deleteTheme(name);
    sendResponse(res, 200, true, 'Theme deleted successfully');
});

export const getActiveTheme = asyncHandler(async (req: Request, res: Response) => {
    const activeTheme = await ThemeService.getActiveTheme();
    sendResponse(res, 200, true, 'Active theme fetched successfully', activeTheme);
});

export const setActiveTheme = asyncHandler(async (req: Request, res: Response) => {
    const { theme, isDark } = req.body;

    if (!theme) {
        throw new AppError('Theme name is required', 400);
    }

    const setting = await ThemeService.setActiveTheme(theme, isDark || false);
    sendResponse(res, 200, true, 'Active theme updated successfully', {
        theme: setting.theme,
        isDark: setting.isDark
    });
});
