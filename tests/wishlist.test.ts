
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import { Product } from '../src/models/product.model';
import { User } from '../src/models/user.model';
import { Wishlist } from '../src/models/wishlist.model';
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

let mongoServer: MongoMemoryServer;
let userToken: string;
let userId: string;
let productId: string;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Mock session to allow transactions on standalone instance
    const originalStartSession = mongoose.startSession.bind(mongoose);
    jest.spyOn(mongoose, 'startSession').mockImplementation(async (options) => {
        const session = await originalStartSession(options);
        session.startTransaction = jest.fn();
        session.commitTransaction = jest.fn();
        session.abortTransaction = jest.fn();
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
    await Wishlist.deleteMany({});

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
        name: 'Wishlist Item',
        description: 'Description',
        htmlDescription: '<p>Description</p>',
        imageUrl: 'http://example.com/image.jpg',
        price: 100,
        category: ['test'],
        stock: 10
    });
    productId = product._id.toString();
});

describe('Wishlist Management', () => {

    describe('Happy Path', () => {
        it('should add item to wishlist', async () => {
            const res = await request(app)
                .post('/api/v1/wishlist/add')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ productId });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            
            // Verify DB
            const wishlist = await Wishlist.findOne({ user: userId });
            expect(wishlist).toBeTruthy();
            expect(wishlist?.products.map(p => p.toString())).toContain(productId);
        });

        it('should get user wishlist', async () => {
            // Seed wishlist
            await Wishlist.create({
                user: userId,
                products: [productId]
            });

            const res = await request(app)
                .get('/api/v1/wishlist')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.products).toHaveLength(1);
            expect(res.body.data.products[0]._id.toString()).toBe(productId);
        });

        it('should remove item from wishlist', async () => {
            // Seed wishlist
            await Wishlist.create({
                user: userId,
                products: [productId]
            });

            const res = await request(app)
                .delete(`/api/v1/wishlist/remove/${productId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            // Verify empty
            const wishlist = await Wishlist.findOne({ user: userId });
            expect(wishlist?.products).toHaveLength(0);
        });
    });

    describe('Sad Path', () => {
        it('should return 404 when adding non-existent product', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .post('/api/v1/wishlist/add')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ productId: fakeId });

            // Expect 404 Not Found as product doesn't exist
            expect(res.status).toBe(404);
        });

        it('should return 401 when accessing without token', async () => {
            const res = await request(app)
                .get('/api/v1/wishlist');

            expect(res.status).toBe(401);
        });
    });
});
