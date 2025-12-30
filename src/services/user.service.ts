import { User, IUser } from '../models/user.model';
import mongoose, {Schema} from "mongoose";

export class UserService {
    static async getUserById(id: string | mongoose.Types.ObjectId): Promise<IUser | null> {
        return User.findById(id);
    }

    static async updateUser(id: string | mongoose.Types.ObjectId, updateData: Partial<IUser>): Promise<IUser | null> {
        return User.findByIdAndUpdate(id, updateData, { new: true });
    }

    static async deleteUser(id: string | mongoose.Types.ObjectId): Promise<IUser | null> {
        return User.findByIdAndDelete(id);
    }

    static async getUserProfile(id: string | mongoose.Types.ObjectId): Promise<IUser | null> {
        return User.findById(id).select('-password');
    }
}