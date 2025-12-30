import { Discount, IDiscount } from '../models/discount.model';

export class DiscountService {
    static async createDiscount(discountData: Partial<IDiscount>): Promise<IDiscount> {
        const discount = new Discount(discountData);
        return discount.save();
    }

    static async getDiscounts(): Promise<IDiscount[]> {
        return Discount.find({ isActive: true });
    }

    static async updateDiscount(id: string, updateData: Partial<IDiscount>): Promise<IDiscount | null> {
        return Discount.findByIdAndUpdate(id, updateData, { new: true });
    }

    static async deleteDiscount(id: string): Promise<IDiscount | null> {
        return Discount.findByIdAndDelete(id);
    }

    static async applyDiscount(discount: IDiscount, totalAmount: number): Promise<number> {
        if (discount.type === 'percentage') {
            return totalAmount * (discount.value / 100);
        } else {
            return Math.min(discount.value, totalAmount);
        }
    }

    static async getApplicableDiscounts(products: string[], categories: string[], totalAmount: number): Promise<IDiscount[]> {
        const currentDate = new Date();
        return Discount.find({
            isActive: true,
            startDate: { $lte: currentDate },
            endDate: { $gte: currentDate },
            $or: [
                { applicableProducts: { $in: products } },
                { applicableCategories: { $in: categories } },
                { $and: [{ applicableProducts: { $exists: false } }, { applicableCategories: { $exists: false } }] },
            ],
            minPurchaseAmount: { $lte: totalAmount },
        });
    }
}