import { Request, Response, NextFunction } from 'express';
import { GlobalSettingService } from '../services/global-setting.service';
import { asyncHandler } from '../utils/asyncHandler';
import { updateSettingsSchema } from '../validators/global-setting.validator';
import { AppError } from '../utils/AppError';
import sendResponse from '../utils/response';

export class GlobalSettingController {
    static getSettings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const settings = await GlobalSettingService.getSettings();
        sendResponse(res, 200, true, 'Global settings fetched successfully', settings);

        
    });

    static updateSettings = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const { error, value } = updateSettingsSchema.validate(req.body);
        if (error) {
            throw new AppError(error.details[0].message, 400);
        }

        const updatedSettings = await GlobalSettingService.updateSettings(value);
        sendResponse(res, 200, true, 'Global settings updated successfully', updatedSettings);
    
    });
}
