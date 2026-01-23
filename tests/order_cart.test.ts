process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://memory-server-uri-placeholder';
process.env.JWT_SECRET = 'test_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.EMAIL_USER = 'test_user';
process.env.EMAIL_PASS = 'test_pass';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.STRIPE_WEBHOOK_SECRET = 'test_stripe_webhook_secret';

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

let mongoReplSet: MongoMemoryReplSet;
let userToken: string;
let adminToken: string;
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

    // Create User
    const user = await User.create({
        name: 'Shopper',
        email: 'shopper@test.com',
        password: 'Password123!',
        role: 'user',
        isVerified: true
    });
    userId = user._id.toString();
    userToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET as string);
    
    // Create Admin
    const admin = await User.create({
        name: 'Admin',
        email: 'admin@test.com',
        password: 'Password123!',
        role: 'admin',
        isVerified: true
    });
    adminToken = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET as string);

    // Create Product
    const product = await Product.create({
        name: 'Test Item',
        description: 'Desc',
        htmlDescription: '<p>Desc</p>',
        price: 50,
        category: ['general'],
        stock: 100,
        imageUrl: 'url'
    });
    productId = product._id.toString();
});

describe('Shopping Cart', () => {
    it('should add item to cart', async () => {
        const res = await request(app)
            .post('/api/v1/cart/add')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                productId: productId,
                quantity: 2
            });
        
        expect(res.status).toBe(200);
    });

    it('should get user cart', async () => {
        const item = await CartItem.create({
             product: productId,
             quantity: 5,
             price: 50
        });
        await Cart.create({
            user: userId,
            items: [item._id]
        });

        const res = await request(app)
            .get('/api/v1/cart')
            .set('Authorization', `Bearer ${userToken}`);
        
        expect(res.status).toBe(200);
        expect(res.body.data.items).toHaveLength(1);
    });
    
    it('should remove item from cart', async () => {
        const item = await CartItem.create({
             product: productId,
             quantity: 5,
             price: 50
        });
        await Cart.create({
            user: userId,
            items: [item._id]
        });
        
        const res = await request(app)
            .delete(`/api/v1/cart/remove/${item._id}`)
            .set('Authorization', `Bearer ${userToken}`);
            
        expect(res.status).toBe(200);
        expect(res.body.data.items).toHaveLength(0);
    });
});

describe('Order System', () => {
    const validOrderPayload = {
        items: [{ product: 'dummy_id', quantity: 1 }], 
        shippingAddress: {
            fullName: 'Test User',
            addressLine1: '123 Main St',
            city: 'Test City',
            postalCode: '12345',
            country: 'Test Country',
            state: 'State'
        },
        billingAddress: {
            fullName: 'Test User',
            addressLine1: '123 Main St',
            city: 'Test City',
            postalCode: '12345',
            country: 'Test Country',
            state: 'State'
        },
        paymentMethod: 'credit_card',
    };

    const createManualOrder = (userId: string, productId: string) => ({
        user: userId,
        items: [{ product: productId, quantity: 1 }],
        shippingAddress: validOrderPayload.shippingAddress,
        billingAddress: validOrderPayload.billingAddress,
        paymentMethod: 'credit_card',
        subtotal: 50,
        tax: 0,
        shippingCost: 10,
        totalAmount: 60,
        discountAmount: 0,
        finalAmount: 60,
        status: 'pending'
    });

    beforeEach(() => {
        validOrderPayload.items[0].product = productId;
    });

    it('should create an order successfully', async () => {
        const res = await request(app)
            .post('/api/v1/orders')
            .set('Authorization', `Bearer ${userToken}`)
            .send(validOrderPayload);
        
        expect(res.status).toBe(201);
        expect(res.body.data.status).toBe('pending');
    });

    it('should get user orders', async () => {
        await Order.create(createManualOrder(userId, productId));

        const res = await request(app)
            .get('/api/v1/orders')
            .set('Authorization', `Bearer ${userToken}`);
        
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
    });
    
    it('should prevent user from seeing others orders', async () => {
         const otherOrder = await Order.create(createManualOrder(new mongoose.Types.ObjectId().toString(), productId));
        
        const res = await request(app)
            .get(`/api/v1/orders/${otherOrder._id}`)
            .set('Authorization', `Bearer ${userToken}`);
            
        expect(res.status).toBe(403);
    });

    describe('Admin Order Management', () => {
        it('should allow admin to get all orders', async () => {
             const order = await Order.create(createManualOrder(userId, productId));
             
             const res = await request(app)
                .patch(`/api/v1/orders/${order._id}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'shipped' });
                
             expect(res.status).toBe(200);
             expect(res.body.data.status).toBe('shipped');
        });

        it('should DENY user from updating order status', async () => {
             const order = await Order.create(createManualOrder(userId, productId));
             
             const res = await request(app)
                .patch(`/api/v1/orders/${order._id}/status`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ status: 'shipped' });
                
             expect(res.status).toBe(403); 
        });
    });
});
