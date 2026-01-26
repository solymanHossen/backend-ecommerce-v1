import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import { User } from '../src/models/user.model';
import { Promotion } from '../src/models/promotion.model';
import { Product } from '../src/models/product.model';
import { Cart } from '../src/models/cart.model';
import { Order } from '../src/models/order.model';
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
let adminToken: string;
let userToken: string;
let userId: string;
let productId: string;

// Helper Addresses
const addresses = {
    fullName: 'Test User',
    addressLine1: '123 Main', 
    city: 'City', 
    postalCode: '00000', 
    country: 'Country', 
    state: 'S'
};

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

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
    await Promotion.deleteMany({});
    await User.deleteMany({});
    await Product.deleteMany({});
    await Cart.deleteMany({});
    await Order.deleteMany({});

    // Create Admin
    const admin = await User.create({
        name: 'Admin',
        email: 'admin@test.com',
        password: 'Password123!',
        role: 'admin',
        isVerified: true
    });
    adminToken = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET as string);

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

    // Create Product ($100)
    const product = await Product.create({
        name: 'Expensive Item',
        description: 'Quality',
        htmlDescription: '<p>Quality</p>',
        imageUrl: 'http://example.com/item.jpg',
        price: 100, 
        stock: 50,
        category: ['General']
    });
    productId = product._id.toString();
});

describe('Promotion Management', () => {

    describe('Happy Path (CRUD)', () => {
        it('should allow admin to create a promotion code', async () => {
            const promoData = {
                name: 'Test Sale',
                description: 'Save big',
                code: 'SAVE10',
                type: 'percentage',
                value: 10,
                minPurchaseAmount: 50,
                startDate: new Date(),
                endDate: new Date(Date.now() + 86400000), 
                isActive: true,
                usageLimit: 100
            };

            const res = await request(app)
                .post('/api/v1/promotions')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(promoData);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.code).toBe('SAVE10');
        });

        it('should allow user to view valid promotions', async () => {
             await Promotion.create({
                name: 'Public Promo',
                description: 'For everyone',
                code: 'WELCOME',
                type: 'fixed',
                value: 5,
                startDate: new Date(),
                endDate: new Date(Date.now() + 100000),
                isActive: true,
                usageLimit: 100
             });

             const res = await request(app)
                .get('/api/v1/promotions')
                .set('Authorization', `Bearer ${userToken}`);
             
             expect(res.status).toBe(200);
             const found = res.body.data.find((p: any) => p.code === 'WELCOME');
             expect(found).toBeTruthy();
        });
    });

    // ==========================================================
    // NEW: Business Logic Tests (Step 3)
    // ==========================================================
    describe('Promotion Application Logic', () => {
        
        const createOrderWithPromo = async (code: string) => {
            return request(app)
                .post('/api/v1/orders')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    items: [{ product: productId, quantity: 1 }],
                    shippingAddress: addresses,
                    billingAddress: addresses,
                    paymentMethod: 'credit_card',
                    promotionCode: code
                });
        };

        it('should NOT apply expired promotion', async () => {
            // Create expired promo
            await Promotion.create({
                name: 'Expired',
                description: 'Old',
                code: 'EXPIRED10',
                type: 'percentage',
                value: 10,
                startDate: new Date(Date.now() - 100000),
                endDate: new Date(Date.now() - 50000), // Ended in past
                isActive: true,
                usageLimit: 100
            });

            const res = await createOrderWithPromo('EXPIRED10');
            
            expect(res.status).toBe(201); // Order created
            expect(res.body.data.discountAmount).toBe(0); // Discount ignored
        });

        it('should NOT apply if usage limit exceeded', async () => {
            // Promo with limit 1
            const promo = await Promotion.create({
                name: 'Limited',
                description: 'One use only',
                code: 'LIMIT1',
                type: 'fixed',
                value: 20,
                startDate: new Date(),
                endDate: new Date(Date.now() + 100000),
                isActive: true,
                usageLimit: 1, // Max 1 use
                usageCount: 1  // Already used 1 time
            });

            const res = await createOrderWithPromo('LIMIT1');

            expect(res.status).toBe(201);
            expect(res.body.data.discountAmount).toBe(0);
        });

        it('should NOT apply if minimum purchase amount not met', async () => {
            // Min purchase $200 (Product is $100)
            await Promotion.create({
                name: 'Big Spender',
                description: 'Spend more',
                code: 'MIN200',
                type: 'fixed',
                value: 50,
                startDate: new Date(),
                endDate: new Date(Date.now() + 100000),
                isActive: true,
                usageLimit: 100,
                minPurchaseAmount: 200 
            });

            const res = await createOrderWithPromo('MIN200');

            expect(res.status).toBe(201);
            expect(res.body.data.discountAmount).toBe(0);
        });

        it('should successfully apply valid promotion', async () => {
            await Promotion.create({
                name: 'Valid',
                description: 'Good',
                code: 'VALID20',
                type: 'fixed',
                value: 20, // $20 off
                startDate: new Date(),
                endDate: new Date(Date.now() + 100000),
                isActive: true,
                usageLimit: 100
            });

            const res = await createOrderWithPromo('VALID20');

            expect(res.status).toBe(201);
            expect(res.body.data.discountAmount).toBe(20);
            // Verify usage count incremented
            const updatedPromo = await Promotion.findOne({ code: 'VALID20' });
            expect(updatedPromo?.usageCount).toBe(1);
        });
    });

    describe('Sad Path (Validation)', () => {
        it('should reject creation without mandatory fields', async () => {
             const res = await request(app)
                .post('/api/v1/promotions')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    code: 'MISSINGFIELDS'
                });
             
             expect(res.status).toBe(400);
        });
    });
});
