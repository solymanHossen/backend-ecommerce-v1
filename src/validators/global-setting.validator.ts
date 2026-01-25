import Joi from 'joi';

export const updateSettingsSchema = Joi.object({
    siteName: Joi.string().min(2).max(100).optional(),
    taxRate: Joi.number().min(0).max(1).optional().messages({
        'number.min': 'Tax rate cannot be negative',
        'number.max': 'Tax rate cannot be greater than 1 (100%)'
    }),
    shippingCost: Joi.number().min(0).optional().messages({
        'number.min': 'Shipping cost cannot be negative'
    }),
    currency: Joi.string().length(3).uppercase().optional(),
    supportEmail: Joi.string().email().optional(),
    isMaintenanceMode: Joi.boolean().optional()
});
