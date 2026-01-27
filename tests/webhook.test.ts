import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import { Order } from '../src/models/order.model';
import { User } from '../src/models/user.model';
import { Product } from '../src/models/product.model';
import { Store } from '../src/models/store.model';
import { Cart } from '../src/models/cart.model';

// Setup Mock Configs
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://memory-server-uri-placeholder';
process.env.JWT_SECRET = 'test_secret';
process.env.STRIPE_WEBHOOK_SECRET = 'test_webhook_secret';
process.env.STRIPE_SECRET_KEY = 'test_stripe_key';

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

// Mock Stripe
jest.mock('stripe', () => {
    return jest.fn().mockImplementation(() => ({
        webhooks: {
            // Mock constructEvent to throw error on specific signature, 
            // otherwise return the body parsed as the event
            constructEvent: jest.fn((body, sig) => {
                if (sig === 'invalid_signature') {
                    throw new Error('Invalid signature');
                }
                return JSON.parse(body.toString());
            })
        }
    }));
});

let mongoServer: MongoMemoryServer;
let userId: string;
let productId: string;
let orderId: string;

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
    await Order.deleteMany({});
    await User.deleteMany({});
    await Product.deleteMany({});
    await Cart.deleteMany({});
    await Store.deleteMany({});

    // Create User
    const user = await User.create({
        name: 'Webhook User',
        email: 'webhook@test.com',
        password: 'Password123!',
        role: 'user',
        isVerified: true
    });
    userId = user._id.toString();

    // Create Store
    const store = await Store.create({
        name: 'Webhook Store',
        owner: user._id, // User is both owner and shopper for simplicity, or create separate admin
        status: 'active',
        commissionRate: 5,
        balance: 0
    });

    // Create Product
    const product = await Product.create({
        name: 'Webhook Product',
        description: 'Test',
        htmlDescription: '<p>Test</p>',
        price: 100,
        stock: 10,
        category: ['test'],
        imageUrl: 'http://example.com/img.jpg',
        store: store._id
    });
    productId = product._id.toString();

    // Create Pending Order
    const order = await Order.create({
        user: userId,
        items: [{
            product: productId,
            quantity: 1,
            price: 100
        }],
        subtotal: 100,
        tax: 0,
        shippingCost: 0,
        totalAmount: 100,
        finalAmount: 100,
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'credit_card',
        shippingAddress: {
            fullName: 'Test', addressLine1: 'Street', city: 'City', 
            state: 'State', postalCode: '1000', country: 'Country'
        },
        billingAddress: {
            fullName: 'Test', addressLine1: 'Street', city: 'City', 
            state: 'State', postalCode: '1000', country: 'Country'
        }
    });
    orderId = order._id.toString();
});

describe('Stripe Webhook', () => {
    
    // Helper to create a dummy stripe event
    const createStripeEvent = (type: string, order_id: string, payment_status = 'paid') => {
        return {
            type,
            data: {
                object: {
                    id: 'cs_test_123',
                    payment_status,
                    metadata: { orderId: order_id },
                    payment_intent: 'pi_test_123'
                }
            }
        };
    };

    it('should reject request with missing signature', async () => {
        const res = await request(app)
            .post('/api/v1/webhook')
            .send({}); // No headers

        expect(res.status).toBe(400);
    });

    it('should reject request with invalid signature', async () => {
        const event = createStripeEvent('checkout.session.completed', orderId);
        
        const res = await request(app)
            .post('/api/v1/webhook')
            .set('stripe-signature', 'invalid_signature') // Triggers mock error
            .set('Content-Type', 'application/json')
            // Send object directly, supertest handles stringify
            .send(event);

        expect(res.status).toBe(400);
    });

    it('should process successful payment and update order/stock', async () => {
        const event = createStripeEvent('checkout.session.completed', orderId);

        const res = await request(app)
            .post('/api/v1/webhook')
            .set('stripe-signature', 'valid_signature')
            .set('Content-Type', 'application/json')
            .send(event);

        expect(res.status).toBe(200);

        // Verify DB updates
        const updatedOrder = await Order.findById(orderId);
        expect(updatedOrder?.paymentStatus).toBe('paid');
        expect(updatedOrder?.status).toBe('processing');

        const updatedProduct = await Product.findById(productId);
        expect(updatedProduct?.stock).toBe(9); // 10 - 1
    });

    it('should handle idempotency (not deduct stock twice)', async () => {
        const event = createStripeEvent('checkout.session.completed', orderId);

        // First Call
        await request(app)
            .post('/api/v1/webhook')
            .set('stripe-signature', 'valid_signature')
            .set('Content-Type', 'application/json')
            .send(event);

        // Check stock after first call
        const productAfterFirst = await Product.findById(productId);
        expect(productAfterFirst?.stock).toBe(9);

        // Second Call (Duplicate Webhook)
        const res = await request(app)
            .post('/api/v1/webhook')
            .set('stripe-signature', 'valid_signature')
            .set('Content-Type', 'application/json')
            .send(event);

        expect(res.status).toBe(200); // Should still return 200 OK

        // Verify stock hasn't decreased again
        const productAfterSecond = await Product.findById(productId);
        expect(productAfterSecond?.stock).toBe(9); // Still 9, not 8
    });

    it('should fail gracefully if order not found', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const event = createStripeEvent('checkout.session.completed', fakeId);

        const res = await request(app)
            .post('/api/v1/webhook')
            .set('stripe-signature', 'valid_signature')
            .set('Content-Type', 'application/json')
            .send(event);

        // Depending on implementation, controller might return 404 or pass error to handler (500)
        // Tests usually expect error status for non-existent resource
        expect(res.status).not.toBe(200);
    });
});
