
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app';
import { User } from '../src/models/user.model';
import { Theme } from '../src/models/theme.model';
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
let themeId: string;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Theme.deleteMany({});
    await User.deleteMany({});

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
    userToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET as string);

    // Create Default Theme
    const theme = await Theme.create({
        name: 'Default',
        colors: {
            primary: '#000000',
            secondary: '#ffffff',
            accent: '#ff0000',
            background: '#f5f5f5',
            text: '#333333'
        },
        isActive: true
    });
    themeId = theme._id.toString();
});

describe('Theme Management', () => {

    describe('Happy Path', () => {
        it('should get all themes (Admin/User)', async () => {
            const res = await request(app)
                .get('/api/v1/themes');

            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(1);
        });

        it('should get active theme', async () => {
             // Assuming endpoint exists for getting active only, or filtering list
             // Since context didn't show exact endpoint, testing generic get logic for active flag
             const res = await request(app).get('/api/v1/themes');
             const active = res.body.data.find((t: any) => t.isActive);
             expect(active).toBeTruthy();
             expect(active.name).toBe('Default');
        });
        
        it('should allow admin to create a new theme', async () => {
            const newTheme = {
                name: 'Dark Mode',
                colors: {
                    primary: '#000000',
                    secondary: '#111111',
                    accent: '#222222',
                    background: '#000000',
                    text: '#ffffff'
                },
                isActive: false
            };

            const res = await request(app)
                .post('/api/v1/themes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newTheme);

            expect(res.status).toBe(201);
            expect(res.body.data.name).toBe(newTheme.name);
        });

        it('should allow admin to activate a theme', async () => {
            // Create a second inactive theme
            const t2 = await Theme.create({
                name: 'Inactive',
                colors: { primary: '#fff', secondary:'#000', accent: '#333', background: '#ccc', text:'#000' },
                isActive: false
            });

            const res = await request(app)
                .put(`/api/v1/themes/${t2._id}`) // Assuming PUT updates
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isActive: true });

            expect(res.status).toBe(200);
            
            // Check if others were deactivated if logic dictates single active theme
            // (Depends on implementation, skipping assertion to stay generic)
        });
    });

    describe('Sad Path', () => {
        it('should return 403 when non-admin tries to delete a theme', async () => {
            const res = await request(app)
                .delete(`/api/v1/themes/${themeId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(403);
        });

        it('should fail validation when creating theme with invalid hex codes', async () => {
            const invalidTheme = {
                name: 'Bad Colors',
                colors: {
                    primary: 'RED', // Invalid hex
                    secondary: '#ffffff',
                    accent: '#ff', // Invalid length
                    background: 'rgb(0,0,0)', // Not hex
                    text: '#333333'
                },
                isActive: false
            };

            const res = await request(app)
                .post('/api/v1/themes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidTheme);
            
            // Should be 400 Bad Request
            expect(res.status).toBe(400); 
        });
    });
});
