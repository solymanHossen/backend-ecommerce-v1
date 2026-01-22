process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://memory-server-uri-placeholder';
process.env.JWT_SECRET = 'test_secret';
process.env.STRIPE_SECRET_KEY = 'test_stripe_key';

import Stripe from 'stripe';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import app from '../src/app';
import { User } from '../src/models/user.model';
import { Product } from '../src/models/product.model';
import { Cart } from '../src/models/cart.model';
import { CartItem } from '../src/models/cart-item.model';
import { Order } from '../src/models/order.model';
import jwt from 'jsonwebtoken';

jest.mock('../src/config/redis', () => ({
  default: {
    get: jest.fn(),
    set: jest.fn(),
    on: jest.fn(),
    quit: jest.fn(),
    disconnect: jest.fn()
  },
  __esModule: true,
}));


jest.mock('stripe', () => {
    return jest.fn().mockImplementation(() => ({
        checkout: {
            sessions: {
                create: jest.fn().mockResolvedValue({
                    id: 'cs_test_123',
                    url: 'http://stripe.com/checkout'
                }),
                retrieve: jest.fn().mockResolvedValue({
                    payment_status: 'paid',
                    metadata: { orderId: 'ORDER_ID' }
                })
            }
        }
    }));
});


let mongoReplSet: MongoMemoryReplSet;
let userToken: string;
let userId: string;
let productId: string;

beforeAll(async () => {
    mongoReplSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongoReplSet.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoReplSet.stop();
});

beforeEach(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Cart.deleteMany({});
    await CartItem.deleteMany({});
    await Order.deleteMany({});
    jest.clearAllMocks();

    const user = await User.create({
        name: 'Shopper',
        email: 'shopper@test.com',
        password: 'Password123!',
        role: 'user',
        isVerified: true
    });
    userId = user._id.toString();
    userToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET as string);
    
    const product = await Product.create({
        name: 'Test Item',
        description: 'Desc',
        htmlDescription: '<p>Desc</p>',
        price: 100,
        category: ['general'],
        stock: 100,
        imageUrl: 'url'
    });
    productId = product._id.toString();
});

describe('Checkout Process', () => {
    const addresses = {
        fullName: 'Test User',
        addressLine1: '123 Main', 
        city: 'City', 
        postalCode: '00000', 
        country: 'Country', 
        state: 'S'
    };
    
    const checkoutPayload = {
        items: [], 
        totalAmount: 220,
        subtotal: 200,
        tax: 10,
        shippingCost: 10,
        finalAmount: 220,
        paymentMethod: 'credit_card',
        shippingAddress: addresses,
        billingAddress: addresses
    };

    it('should create checkout session from cart', async () => {
        const item = await CartItem.create({
            product: productId,
            quantity: 2,
            price: 100
        });
        await Cart.create({
            user: userId,
            items: [item._id]
        });
        
        const payload = { ...checkoutPayload, items: [{ product: productId, quantity: 2, price: 100 }] };

        const res = await request(app)
            .post('/api/v1/checkout/create-checkout-session')
            .set('Authorization', `Bearer ${userToken}`)
            .send(payload);

        expect(res.status).toBe(200);
        expect(res.body.data.sessionId).toBe('cs_test_123');
        // expect(mockCreateSession).toHaveBeenCalled(); 
    });
});
