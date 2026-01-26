import { User } from "../models/user.model";
import { Store, IStore } from "../models/store.model";
import { AppError } from "../utils/AppError";
import { UserRole } from "../constants/roles";

class StoreService {
    async createStore(userId: string, data: Partial<IStore>): Promise<IStore> {
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const existingStore = await Store.findOne({ owner: userId });
        if (existingStore) {
            throw new AppError("User already has a store", 400);
        }

        const store = await Store.create({
            ...data,
            owner: userId,
            status: 'pending' // Default status
        });

        // Update user role and link store
        user.role = UserRole.VENDOR;
        user.store = store._id;
        await user.save();

        return store;
    }

    async getStoreBySlug(slug: string): Promise<IStore> {
        const store = await Store.findOne({ slug }).populate('owner', 'name email profilePicture');
        if (!store) {
            throw new AppError("Store not found", 404);
        }
        return store;
    }

    async getStoreByOwner(userId: string): Promise<IStore> {
        const store = await Store.findOne({ owner: userId });
        if (!store) {
            throw new AppError("Store not found for this user", 404);
        }
        return store;
    }

    async updateStore(storeId: string, data: Partial<IStore>): Promise<IStore> {
        const store = await Store.findByIdAndUpdate(
            storeId,
            { $set: data },
            { new: true, runValidators: true }
        );

        if (!store) {
            throw new AppError("Store not found", 404);
        }
        return store;
    }
}

export const storeService = new StoreService();
