process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://memory-server-uri-placeholder';
process.env.JWT_SECRET = 'test_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.EMAIL_USER = 'test_user';
process.env.EMAIL_PASS = 'test_pass';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.STRIPE_WEBHOOK_SECRET = 'test_stripe_webhook_secret';

import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { User } from '../src/models/user.model';
import { Store } from '../src/models/store.model';
import { Product } from '../src/models/product.model';
import { Order } from '../src/models/order.model';
import { GlobalSetting } from '../src/models/global-setting.model';
import { OrderService } from '../src/services/order.service';

jest.mock('../src/config/redis', () => ({
  default: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    on: jest.fn(),
    quit: jest.fn(),
    disconnect: jest.fn()
  },
  __esModule: true,
}));

// Mock Nodemailer
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue(true)
    })
}));

describe('Verify Multi-Vendor Order Logic', () => {
    let mongoServer: MongoMemoryReplSet;

    beforeAll(async () => {
        mongoServer = await MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: 'wiredTiger' }
        });
        await mongoose.connect(mongoServer.getUri());
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        await User.deleteMany({});
        await Store.deleteMany({});
        await Product.deleteMany({});
        await Order.deleteMany({});
        await GlobalSetting.deleteMany({});
    });

    it('should correctly split orders and calculate totals for multi-vendor purchase', async () => {
        // 0. Setup Global Settings
        await GlobalSetting.create({
            siteName: 'Test Market',
            taxRate: 0.05, // 5%
            shippingCost: 10, // $10 flat
            currency: 'USD'
        });

        // 1. Create Actors
        const customer = await User.create({
            name: 'Test Customer',
            email: 'test-mv-customer@example.com',
            password: 'password123',
            role: 'user',
            isVerified: true
        });

        const vendor1 = await User.create({
            name: 'Vendor One',
            email: 'test-mv-vendor1@example.com',
            password: 'password123',
            role: 'vendor',
            isVerified: true
        });

        const vendor2 = await User.create({
            name: 'Vendor Two',
            email: 'test-mv-vendor2@example.com',
            password: 'password123',
            role: 'vendor',
            isVerified: true
        });

        // 2. Create Stores
        const storeA = await Store.create({
            name: 'Test Store A',
            owner: vendor1._id,
            status: 'active',
            commissionRate: 10
        });
        vendor1.store = storeA._id;
        await vendor1.save();

        const storeB = await Store.create({
            name: 'Test Store B',
            owner: vendor2._id,
            status: 'active',
            commissionRate: 15
        });
        vendor2.store = storeB._id;
        await vendor2.save();

        // 3. Create Products
        const productA = await Product.create({
            name: 'Test Product A',
            slug: 'test-product-a',
            description: 'Desc A',
            htmlDescription: '<p>Desc A</p>',
            price: 100,
            category: ['electronics'],
            imageUrl: 'http://example.com/a.jpg',
            stock: 50,
            store: storeA._id,
            status: 'approved'
        });

        const productB = await Product.create({
            name: 'Test Product B',
            slug: 'test-product-b',
            description: 'Desc B',
            htmlDescription: '<p>Desc B</p>',
            price: 200,
            category: ['fashion'],
            imageUrl: 'http://example.com/b.jpg',
            stock: 50,
            store: storeB._id,
            status: 'approved'
        });

        // 4. Simulate Order
        const items = [
            { product: productA._id.toString(), quantity: 1 },
            { product: productB._id.toString(), quantity: 1 }
        ];

        const addressMock = {
            fullName: 'Test Customer',
            addressLine1: '123 Test St',
            city: 'Test City',
            state: 'TS',
            postalCode: '12345',
            country: 'TestLand'
        };

        const parentOrder = await OrderService.createOrder({
            user: customer._id,
            items: items,
            shippingAddress: addressMock,
            billingAddress: addressMock,
            paymentMethod: 'credit_card'
        });

        // 5. Verifications

        // Verify Parent Order
        expect(parentOrder.items.length).toBe(2);
        expect(parentOrder.children).toBeDefined();
        expect(parentOrder.children?.length).toBe(2);
        
        // Expected Total: 335
        // Product A: 100
        // Product B: 200
        // Subtotal: 300
        // Tax (5%): 15
        // Shipping ($10 * 2): 20
        expect(parentOrder.totalAmount).toBe(335);

        // Verify Children
        const childOrders = await Order.find({ parentOrder: parentOrder._id });
        expect(childOrders.length).toBe(2);

        const orderForStoreA = childOrders.find(o => o.store?.toString() === storeA._id.toString());
        const orderForStoreB = childOrders.find(o => o.store?.toString() === storeB._id.toString());

        expect(orderForStoreA).toBeDefined();
        expect(orderForStoreB).toBeDefined();

        if (orderForStoreA && orderForStoreB) {
            // Check Child A: Price 100 + 5 Tax + 10 Shipping = 115
            expect(orderForStoreA.totalAmount).toBe(115);
            
            // Check Child B: Price 200 + 10 Tax + 10 Shipping = 220
            expect(orderForStoreB.totalAmount).toBe(220);
        }
    });
});
