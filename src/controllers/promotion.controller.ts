import { Request, Response } from 'express';
import { PromotionService } from '../services/promotion.service';
import logger from "../utils/logger";

export const createPromotion = async (req: Request, res: Response):Promise<void> => {
    try {
        const promotion = await PromotionService.createPromotion(req.body);
        res.status(201).json(promotion);
    } catch (error) {
        logger.error('Error creating promotion:', error);
        res.status(400).json({ error: 'Error creating promotion' });
    }
};

export const getPromotions = async (req: Request, res: Response) => {
    try {
        const promotions = await PromotionService.getPromotions();
        res.json(promotions);
    } catch (error) {
        res.status(400).json({ error: 'Error fetching promotions' });
    }
};

export const updatePromotion = async (req: Request, res: Response):Promise<void> => {
    try {
        const promotion = await PromotionService.updatePromotion(req.params.id, req.body);
        if (!promotion) {
            res.status(404).json({ error: 'Promotion not found' }); return ;
        }
        res.json(promotion);
    } catch (error) {
        logger.error('Error fetching update promotion',error);
        res.status(400).json({ error: 'Error updating promotion' });
    }
};

export const deletePromotion = async (req: Request, res: Response):Promise<void> => {
    try {
        const promotion = await PromotionService.deletePromotion(req.params.id);
        if (!promotion) {
            res.status(404).json({ error: 'Promotion not found' }); return ;
        }
        res.json({ message: 'Promotion deleted successfully' });
    } catch (error) {
        logger.error("Error deleting promotion page",error)
        res.status(400).json({ error: 'Error deleting promotion' });
    }
};

export const getPromotionEffectiveness = async (req: Request, res: Response) => {
    try {
        const effectiveness = await PromotionService.getPromotionEffectiveness(req.params.id);
        res.json(effectiveness);
    } catch (error) {
        logger.error("Error for promotion effectiveness",error)
        res.status(400).json({ error: 'Error fetching promotion effectiveness' });
    }
};