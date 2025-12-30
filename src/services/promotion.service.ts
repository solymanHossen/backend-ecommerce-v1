import { Promotion, IPromotion } from '../models/promotion.model';
import { Order } from '../models/order.model';

export class PromotionService {
    static async createPromotion(promotionData: Partial<IPromotion>): Promise<IPromotion> {
        const promotion = new Promotion(promotionData);
        return promotion.save();
    }

    static async getPromotions(): Promise<IPromotion[]> {
        return Promotion.find({ isActive: true });
    }

    static async getPromotionByCode(code: string): Promise<IPromotion | null> {
        return Promotion.findOne({ code, isActive: true });
    }

    static async updatePromotion(id: string, updateData: Partial<IPromotion>): Promise<IPromotion | null> {
        return Promotion.findByIdAndUpdate(id, updateData, { new: true });
    }

    static async deletePromotion(id: string): Promise<IPromotion | null> {
        return Promotion.findByIdAndDelete(id);
    }

    static async applyPromotion(promotion: IPromotion, totalAmount: number): Promise<number> {
        if (promotion.type === 'percentage') {
            return totalAmount * (promotion.value / 100);
        } else {
            return Math.min(promotion.value, totalAmount);
        }
    }

    static async incrementUsageCount(id: string): Promise<void> {
        await Promotion.findByIdAndUpdate(id, { $inc: { usageCount: 1 } });
    }

    static async getPromotionEffectiveness(id: string): Promise<any> {
        const promotion = await Promotion.findById(id);
        if (!promotion) {
            throw new Error('Promotion not found');
        }

        const ordersWithPromotion = await Order.find({ promotion: id });
        const totalRevenue = ordersWithPromotion.reduce((sum, order) => sum + order.finalAmount, 0);
        const totalDiscount = ordersWithPromotion.reduce((sum, order) => sum + order.discountAmount, 0);

        return {
            promotionName: promotion.name,
            usageCount: promotion.usageCount,
            totalRevenue,
            totalDiscount,
            averageOrderValue: totalRevenue / ordersWithPromotion.length,
        };
    }
}