process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://memory-server-uri-placeholder';
process.env.JWT_SECRET = 'test_secret';

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import { User } from '../src/models/user.model';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

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

// Mock Nodemailer
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockResolvedValue(true)
    })
}));

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await User.deleteMany({});
});

describe('Auth Endpoints', () => {
    const validUser = {
        name: 'Test User', 
        email: 'test@example.com', 
        password: 'Password123!' 
    };

    describe('Registration', () => {
        it('should register a new user', async () => {
            const res = await request(app).post('/api/v1/auth/register').send(validUser);
            expect(res.status).toBe(201);
            // expect(res.body.data).toHaveProperty('token'); // Not returned on register
            // expect(res.body.data.user.email).toBe(validUser.email);
            expect(res.body.message).toContain("registered successfully");
        });

        it('should not register user with existing email', async () => {
            await request(app).post('/api/v1/auth/register').send(validUser); // Register once
            
            const res = await request(app).post('/api/v1/auth/register').send(validUser); // Register again
            expect(res.status).toBe(400); 
        });
    });

    describe('Email Verification', () => {
        it('should verify email with valid OTP', async () => {
            const plainOTP = "123456";
            const salt = await bcrypt.genSalt(10);
            const hashedOTP = await bcrypt.hash(plainOTP, salt);
            
            await User.create({
                ...validUser,
                verificationOTP: hashedOTP,
                otpExpires: new Date(Date.now() + 100000)
            });

            const res = await request(app).post('/api/v1/auth/verify-email').send({
                email: validUser.email,
                otp: plainOTP
            });

            expect(res.status).toBe(200);
            
            const user = await User.findOne({ email: validUser.email });
            expect(user?.isVerified).toBe(true);
            expect(user?.verificationOTP).toBeUndefined();
        });

        it('should fail verification with invalid OTP', async () => {
             const plainOTP = "123456";
             const hashedOTP = await bcrypt.hash(plainOTP, 10);

            await User.create({
                ...validUser,
                verificationOTP: hashedOTP,
                otpExpires: new Date(Date.now() + 100000)
            });

            const res = await request(app).post('/api/v1/auth/verify-email').send({
                email: validUser.email,
                otp: "000000"
            });

            expect(res.status).toBe(400); 
        });
    });
    
    describe('Login & Tokens', () => {
        beforeEach(async () => {
           // Create verified user via API if possible, or just User.create but carefully
           // Using API ensures hashing matches
           await request(app).post('/api/v1/auth/register').send(validUser);
           await User.updateOne({ email: validUser.email }, { isVerified: true });
        });

        it('should login and return tokens', async () => {
            const res = await request(app).post('/api/v1/auth/login').send({
                email: validUser.email, 
                password: validUser.password
            });
            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty('token');
        });
    });

    describe('Password Management', () => {
        it('should send forgot password email', async () => {
            await User.create({ ...validUser, isVerified: true });
            
            const res = await request(app).post('/api/v1/auth/forgot-password').send({
                email: validUser.email
            });
            
            expect(res.status).toBe(200);
            
            const user = await User.findOne({ email: validUser.email });
            expect(user?.resetPasswordToken).toBeDefined();
        });
        
        it('should reset password with valid token', async () => {
             // Create User
             const user = new User({ ...validUser, isVerified: true });
             
             // Create Token manually same way as backend
             const resetToken = crypto.randomBytes(32).toString('hex');
             const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
             
             user.resetPasswordToken = hashedToken;
             user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
             await user.save();
             
             const newPassword = "NewPassword!234";
             const res = await request(app)
                .post(`/api/v1/auth/reset-password/${resetToken}`) // Send raw token
                .send({
                     password: newPassword
                });
             
             expect(res.status).toBe(200);
             
             // Verify can login with new password
             const loginRes = await request(app).post('/api/v1/auth/login').send({
                 email: validUser.email,
                 password: newPassword
             });
             expect(loginRes.status).toBe(200);
        });
    });
});
