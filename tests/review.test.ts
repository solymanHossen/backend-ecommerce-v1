
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import { Product } from '../src/models/product.model';
import { User } from '../src/models/user.model';
import { Review } from '../src/models/review.model';
import { Store } from '../src/models/store.model';
import jwt from 'jsonwebtoken';

// Setup Mock Configs
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://memory-server-uri-placeholder';
process.env.JWT_SECRET = 'test_secret';

// Mock Redis
jest.mock('../src/config/redis', () => ({
  default: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
    disconnect: jest.fn()
  },
  __esModule: true,
}));

// Mock Cloudinary
jest.mock('../src/config/cloudinary', () => ({
    createUploader: jest.fn().mockReturnValue({
        single: jest.fn().mockReturnValue((req: any, res: any, next: any) => next()),
        array: jest.fn().mockReturnValue((req: any, res: any, next: any) => next())
    }),
    uploader: {
        upload: jest.fn(),
        destroy: jest.fn()
    }
}));

let mongoServer: MongoMemoryServer;
let adminToken: string;
let userToken: string;
let userId: string;
let productId: string;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Mock session to allow transactions on standalone instance
    // We create a real session but disable the actual transaction commands
    const originalStartSession = mongoose.startSession.bind(mongoose);
    jest.spyOn(mongoose, 'startSession').mockImplementation(async (options) => {
        const session = await originalStartSession(options);
        session.startTransaction = jest.fn();
        session.commitTransaction = jest.fn();
        session.abortTransaction = jest.fn();
        // We keep endSession as is, or mock it if it causes issues
        return session;
    });
});


afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Product.deleteMany({});
    await User.deleteMany({});
    await Review.deleteMany({});
    await Store.deleteMany({});

    // Create Admin
    const admin = await User.create({
        name: 'Admin',
        email: 'admin@test.com',
        password: 'Password123!',
        role: 'admin',
        isVerified: true
    });
    adminToken = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET as string);

    // Create Store
    const store = await Store.create({
        name: 'Review Store',
        owner: admin._id,
        status: 'active',
        commissionRate: 5,
        balance: 0
    });

    // Create User
    const user = await User.create({
        name: 'User',
        email: 'user@test.com',
        password: 'Password123!',
        role: 'user',
        isVerified: true
    });
    userId = user._id.toString();
    userToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET as string);

    // Create Product
    const product = await Product.create({
        name: 'Test Product',
        description: 'Description',
        htmlDescription: '<p>Description</p>',
        imageUrl: 'http://example.com/image.jpg',
        price: 100,
        category: ['test'],
        stock: 10,
        store: store._id
    });
    productId = product._id.toString();
});

describe('Review Management', () => {
    
    describe('Happy Path', () => {
        it('should allow user to create a review for a product', async () => {
            const reviewData = {
                rating: 5,
                title: 'Great Product',
                comment: 'I loved it!'
            };

            const res = await request(app)
                .post(`/api/v1/reviews/products/${productId}/reviews`)
                .set('Authorization', `Bearer ${userToken}`)
                .send(reviewData);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.rating).toBe(5);
            expect(res.body.data.product).toBe(productId);
        });

        it('should get all reviews for a product', async () => {
            // Create a review first manually or via API
            await Review.create({
                user: userId,
                product: productId,
                rating: 4,
                title: 'Nice',
                comment: 'Good stuff'
            });

            const res = await request(app)
                .get(`/api/v1/reviews/products/${productId}/reviews`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].title).toBe('Nice');
        });
    });

    describe('Sad Path', () => {
        it('should return 404 when reviewing a non-existent product', async () => {
             const fakeId = new mongoose.Types.ObjectId();
             const res = await request(app)
                .post(`/api/v1/reviews/products/${fakeId}/reviews`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    rating: 5,
                    title: 'Ghost Product',
                    comment: 'Does not exist'
                });

            expect(res.status).toBe(404);
        });

        it('should fail with invalid rating', async () => {
             const res = await request(app)
                .post(`/api/v1/reviews/products/${productId}/reviews`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    rating: 6, // Invalid
                    title: 'Invincible',
                    comment: 'Too good'
                });

             // Expect 400 Validation Error
            expect(res.status).toBe(400); 
        });

        it('should prevent user from deleting someone else\'s review', async () => {
             // Create a review by another user
             const otherUser = await User.create({
                 name: 'Other',
                 email: 'other@test.com',
                 password: 'pwd',
                 role: 'user'
             });
             
             const review = await Review.create({
                 user: otherUser._id,
                 product: productId,
                 rating: 3,
                 title: 'Meh',
                 comment: 'Okay'
             });

             const res = await request(app)
                 .delete(`/api/v1/reviews/${review._id}`)
                 .set('Authorization', `Bearer ${userToken}`); // Using current user token

             // Should be 403 Forbidden or 404 (if logic hides others' resources)
             // Typically 403 for unauthorized access to resource
             // Assuming controller checks ownership
             expect([403, 404, 401]).toContain(res.status);
        });
    });
});
