
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
        label: 'Default Theme',
        colors: {
            light: {
                background: '#ffffff', foreground: '#000000',
                primary: '#000000', 'primary-foreground': '#ffffff',
                secondary: '#f5f5f5', 'secondary-foreground': '#000000',
                accent: '#f5f5f5', 'accent-foreground': '#000000',
                muted: '#f5f5f5', 'muted-foreground': '#666666',
                card: '#ffffff', 'card-foreground': '#000000',
                border: '#e5e5e5', input: '#e5e5e5', ring: '#000000'
            },
            dark: {
                background: '#09090b', foreground: '#fafafa',
                primary: '#fafafa', 'primary-foreground': '#09090b',
                secondary: '#27272a', 'secondary-foreground': '#fafafa',
                accent: '#27272a', 'accent-foreground': '#fafafa',
                muted: '#27272a', 'muted-foreground': '#a1a1aa',
                card: '#09090b', 'card-foreground': '#fafafa',
                border: '#27272a', input: '#27272a', ring: '#fafafa'
            }
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
            expect(res.body.data.themes).toHaveLength(1);
        });

        it('should get active theme', async () => {
             const res = await request(app).get('/api/v1/themes/active');
             
             expect(res.status).toBe(200);
             expect(res.body.data.theme).toBe('default');
        });
        
        it('should allow admin to create a new theme', async () => {
            const newTheme = {
                name: 'DarkMode',
                label: 'Dark Mode Theme',
                colors: {
                    light: {
                        background: '#ffffff', foreground: '#000000',
                        primary: '#000000', 'primary-foreground': '#ffffff',
                        secondary: '#f5f5f5', 'secondary-foreground': '#000000',
                        accent: '#f5f5f5', 'accent-foreground': '#000000',
                        muted: '#f5f5f5', 'muted-foreground': '#666666',
                        card: '#ffffff', 'card-foreground': '#000000',
                        border: '#e5e5e5', input: '#e5e5e5', ring: '#000000'
                    },
                    dark: {
                        background: '#000000', foreground: '#ffffff',
                        primary: '#ffffff', 'primary-foreground': '#000000',
                        secondary: '#111111', 'secondary-foreground': '#ffffff',
                        accent: '#222222', 'accent-foreground': '#ffffff',
                        muted: '#333333', 'muted-foreground': '#aaaaaa',
                        card: '#000000', 'card-foreground': '#ffffff',
                        border: '#333333', input: '#333333', ring: '#ffffff'
                    }
                }
                // isActive removed as validator likely forbids setting it directly on create
            };

            const res = await request(app)
                .post('/api/v1/themes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newTheme);

            expect(res.status).toBe(201);
            expect(res.body.data.theme.name).toBe(newTheme.name);
        });

        it('should allow admin to activate a theme', async () => {
             // Create a second inactive theme
             const t2 = await Theme.create({
                 name: 'Inactive',
                 label: 'Inactive Theme',
                 colors: {
                     light: {
                         background: '#ffffff', foreground: '#000000',
                         primary: '#000000', 'primary-foreground': '#ffffff',
                         secondary: '#f5f5f5', 'secondary-foreground': '#000000',
                         accent: '#f5f5f5', 'accent-foreground': '#000000',
                         muted: '#f5f5f5', 'muted-foreground': '#666666',
                         card: '#ffffff', 'card-foreground': '#000000',
                         border: '#e5e5e5', input: '#e5e5e5', ring: '#000000'
                     },
                     dark: {
                         background: '#09090b', foreground: '#fafafa',
                         primary: '#fafafa', 'primary-foreground': '#09090b',
                         secondary: '#27272a', 'secondary-foreground': '#fafafa',
                         accent: '#27272a', 'accent-foreground': '#fafafa',
                         muted: '#27272a', 'muted-foreground': '#a1a1aa',
                         card: '#09090b', 'card-foreground': '#fafafa',
                         border: '#27272a', input: '#27272a', ring: '#fafafa'
                     }
                 }
                 // isActive: false  <-- REMOVED as not in schema
             });
 
             const res = await request(app)
                 .post('/api/v1/themes/active')
                 .set('Authorization', `Bearer ${adminToken}`)
                 .send({ theme: t2.name, isDark: false });
 
             expect(res.status).toBe(200);
             expect(res.body.data.theme).toBe(t2.name);
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
                label: 'Bad Colors Theme',
                colors: {
                    light: {
                        primary: 'RED', // Invalid hex
                        secondary: '#ffffff',
                        background: '#ffffff', foreground: '#000000',
                        'primary-foreground': '#ffffff',
                        'secondary-foreground': '#000000',
                        accent: '#f5f5f5', 'accent-foreground': '#000000',
                        muted: '#f5f5f5', 'muted-foreground': '#666666',
                        card: '#ffffff', 'card-foreground': '#000000',
                        border: '#e5e5e5', input: '#e5e5e5', ring: '#000000'
                    },
                    dark: {
                        // Missing fields entirely implies validation failure too
                        background: 'rgb(0,0,0)' // Invalid format
                    }
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
