
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import Models
import { User } from '../models/user.model';
import { Product } from '../models/product.model';
import { GlobalSetting } from '../models/global-setting.model';
import { Theme } from '../models/theme.model';
import { Order } from '../models/order.model';
import { Review } from '../models/review.model';
import { Cart } from '../models/cart.model';
import { CartItem } from '../models/cart-item.model';
import { Wishlist } from '../models/wishlist.model';
import { Discount } from '../models/discount.model';
import { Promotion } from '../models/promotion.model';
import { Setting } from '../models/setting.model';

// Import Services
import { ThemeService } from '../services/theme.service';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_db';

const cleanData = async () => {
  console.log('🧹 Cleaning existing data...');
  
  await User.deleteMany({});
  await Product.deleteMany({});
  await Order.deleteMany({});
  await Review.deleteMany({});
  await GlobalSetting.deleteMany({});
  await Cart.deleteMany({});
  await CartItem.deleteMany({});
  await Wishlist.deleteMany({});
  await Discount.deleteMany({});
  await Promotion.deleteMany({});
  await Setting.deleteMany({});
  
  // Note: We are NOT deleting Themes as requested
  
  console.log('✅ Data cleaned successfully');
};

const seedGlobalSettings = async () => {
  console.log('⚙️  Seeding Global Settings...');
  
  const settingData = {
    siteName: 'My Ecom Store',
    taxRate: 0.1, // 10%
    shippingCost: 15,
    currency: 'USD',
    isMaintenanceMode: false,
    supportEmail: 'support@demo.com'
  };

  // Using findOneAndUpdate with upsert ensures singleton pattern logic if run multiple times
  // But since we cleaned data, create is fine too. sticking to robust singleton logic.
  await GlobalSetting.findOneAndUpdate({}, settingData, { 
    upsert: true, 
    new: true,
    setDefaultsOnInsert: true 
  });
  
  console.log('✅ Global Settings seeded');
};

const seedAdmin = async () => {
  console.log('👤 Seeding Admin User...');
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('123456', salt);
  
  const admin = await User.create({
    name: 'Super Admin',
    email: 'admin@demo.com',
    password: hashedPassword,
    role: 'admin',
    isVerified: true,
    address: {
        street: '123 Admin St',
        city: 'Admin City',
        state: 'Admin State',
        zipCode: '10000',
        country: 'Country'
    },
    bio: 'I am the shop owner.',
    profilePicture: 'https://ui-avatars.com/api/?name=Super+Admin&background=0D8ABC&color=fff'
  });
  
  console.log('✅ Admin User created');
  return admin;
};

const seedThemes = async () => {
  console.log('🎨 Seeding Themes...');
  try {
    await ThemeService.initializeDatabase();
    console.log('✅ Themes initialized');
  } catch (error: any) {
    console.error('❌ Error seeding themes:', error.message);
  }
};

const seedPromotions = async () => {
    console.log('🎫 Seeding Promotions...');

    await Promotion.create({
        name: 'Launch Special',
        description: 'Get 15% off your first order',
        type: 'percentage',
        value: 15,
        code: 'LAUNCH15',
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)), // 1 month from now
        isActive: true,
        usageLimit: 100,
        usageCount: 0
    });

    await Promotion.create({
        name: 'Fixed Discount',
        description: '$20 off orders over $100',
        type: 'fixed',
        value: 20,
        code: 'SAVE20',
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 2)),
        isActive: true,
        usageLimit: 50,
        usageCount: 0,
        minPurchaseAmount: 100
    });

    console.log('✅ Promotions seeded');
};

const seedDiscounts = async () => {
    console.log('🏷️ Seeding Discounts...');

    await Discount.create({
        name: 'Summer Sale',
        description: '20% off on all Electronics',
        type: 'percentage',
        value: 20,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        isActive: true,
        applicableCategories: ['Electronics']
    });

    console.log('✅ Discounts seeded');
};

const seedOrders = async (user: any, products: any[]) => {
    console.log('📦 Seeding Orders...');

    const statuses = ['delivered', 'shipped', 'processing', 'pending'] as const;
    const paymentStatuses = ['paid', 'paid', 'paid', 'pending'] as const;

    // Create 4 orders
    for (let i = 0; i < 4; i++) {
        // Pick 2 random products
        const p1 = products[Math.floor(Math.random() * products.length)];
        const p2 = products[Math.floor(Math.random() * products.length)];

        const item1 = {
            product: p1._id,
            quantity: 1,
            price: p1.price
        };
        const item2 = {
            product: p2._id,
            quantity: 2,
            price: p2.price
        };

        const subtotal = item1.price * item1.quantity + item2.price * item2.quantity;
        const shippingCost = 15;
        const tax = subtotal * 0.1;
        const totalAmount = subtotal + tax + shippingCost;

        await Order.create({
            user: user._id,
            items: [item1, item2],
            subtotal,
            tax,
            shippingCost,
            totalAmount: totalAmount, // totalAmount key per model
            discountAmount: 0,
            finalAmount: totalAmount,
            status: statuses[i],
            paymentStatus: paymentStatuses[i],
            paymentMethod: 'credit_card',
            shippingAddress: {
                fullName: user.name,
                addressLine1: '123 Fake St',
                city: 'New York',
                state: 'NY',
                postalCode: '10001',
                country: 'USA'
            },
            billingAddress: {
                fullName: user.name,
                addressLine1: '123 Fake St',
                city: 'New York',
                state: 'NY',
                postalCode: '10001',
                country: 'USA'
            }
        });
    }

    console.log('✅ Sample Orders created');
};

const seedWishlist = async (user: any, products: any[]) => {
    console.log('💖 Seeding Wishlist...');
    
    // Pick 3 random products
    const wishlistProducts = products.slice(0, 3).map(p => p._id);
    
    await Wishlist.create({
        user: user._id,
        products: wishlistProducts
    });
    
    console.log('✅ Wishlist seeded');
};

const seedProductsAndReviews = async (adminUser: any) => {
  console.log('🛍️  Seeding Products & Reviews...');
  
  const categories = ['Electronics', 'Fashion', 'Home & Living', 'Accessories'];
  
  const dummyProducts = [
    {
      name: 'Wireless Noise Cancelling Headphones',
      price: 299.99,
      category: ['Electronics', 'Accessories'],
      imageUrl: 'https://placehold.co/600x400?text=Headphones',
      description: 'Experience world-class noise cancellation and premium sound quality.',
      htmlDescription: '<p>Experience world-class noise cancellation and premium sound quality.</p>',
    },
    {
      name: 'Smart Fitness Watch',
      price: 149.50,
      category: ['Electronics', 'Fitness'],
      imageUrl: 'https://placehold.co/600x400?text=Smart+Watch',
      description: 'Track your health and fitness goals with precision.',
      htmlDescription: '<p>Track your health and fitness goals with precision.</p>',
    },
    {
      name: 'Premium Cotton T-Shirt',
      price: 29.99,
      category: ['Fashion'],
      imageUrl: 'https://placehold.co/600x400?text=T-Shirt',
      description: 'Soft, breathable cotton perfect for everyday wear.',
      htmlDescription: '<p>Soft, breathable cotton perfect for everyday wear.</p>',
    },
    {
      name: 'Ergonomic Office Chair',
      price: 199.00,
      category: ['Home & Living', 'Furniture'],
      imageUrl: 'https://placehold.co/600x400?text=Office+Chair',
      description: 'Work in comfort with adjustable support and lumbar cushioning.',
      htmlDescription: '<p>Work in comfort with adjustable support and lumbar cushioning.</p>',
    },
    {
      name: 'Modern Coffee Table',
      price: 89.99,
      category: ['Home & Living', 'Furniture'],
      imageUrl: 'https://placehold.co/600x400?text=Coffee+Table',
      description: 'Minimalist design to elevate your living room decor.',
      htmlDescription: '<p>Minimalist design to elevate your living room decor.</p>',
    },
    {
      name: 'Bluetooth Portable Speaker',
      price: 59.95,
      category: ['Electronics'],
      imageUrl: 'https://placehold.co/600x400?text=Speaker',
      description: 'Powerful sound in a compact, waterproof design.',
      htmlDescription: '<p>Powerful sound in a compact, waterproof design.</p>',
    },
    {
      name: 'Leather Weekend Bag',
      price: 120.00,
      category: ['Fashion', 'Accessories'],
      imageUrl: 'https://placehold.co/600x400?text=Leather+Bag',
      description: 'Stylish and spacious bag for your weekend getaways.',
      htmlDescription: '<p>Stylish and spacious bag for your weekend getaways.</p>',
    },
    {
      name: 'Digital Camera 4K',
      price: 850.00,
      category: ['Electronics'],
      imageUrl: 'https://placehold.co/600x400?text=Camera',
      description: 'Capture life moments in stunning 4K resolution.',
      htmlDescription: '<p>Capture life moments in stunning 4K resolution.</p>',
    },
    {
      name: 'Ceramic Plant Pot',
      price: 15.00,
      category: ['Home & Living'],
      imageUrl: 'https://placehold.co/600x400?text=Plant+Pot',
      description: 'Beautiful ceramic pot for your indoor plants.',
      htmlDescription: '<p>Beautiful ceramic pot for your indoor plants.</p>',
    },
    {
      name: 'Gaming Mechanical Keyboard',
      price: 110.00,
      category: ['Electronics', 'Gaming'],
      imageUrl: 'https://placehold.co/600x400?text=Keyboard',
      description: 'Tactile switches and RGB lighting for the ultimate gaming experience.',
      htmlDescription: '<p>Tactile switches and RGB lighting for the ultimate gaming experience.</p>',
    }
  ];

  const createdProducts = [];

  for (const prodData of dummyProducts) {
    // Create Product
    // Note: slug is handled by pre-save hook in product.model.ts usually. 
    // If not, we might need to add it, but based on context it seems likely.
    // I'll add a simple slug generator just in case the hook fails or isn't triggered on create (though it should be).
    const slug = prodData.name.toLowerCase().replace(/ /g, '-') + '-' + Math.floor(Math.random() * 1000);

    const product = await Product.create({
      ...prodData,
      slug: slug,
      stock: Math.floor(Math.random() * 100) + 10,
      imagePublicId: 'dummy_id' // Required by some logic probably
    });

    // Add Reviews
    const reviewCount = Math.floor(Math.random() * 3) + 3; // 3 to 5 reviews
    let totalRating = 0;
    const reviewIds = [];

    for (let i = 0; i < reviewCount; i++) {
        const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars
        totalRating += rating;

        const review = await Review.create({
            user: adminUser._id,
            product: product._id,
            rating: rating,
            title: i % 2 === 0 ? 'Great product!' : 'Excellent value',
            comment: 'This is a demo review generated by the seeder script. I really liked the quality and shipping speed.',
        });
        reviewIds.push(review._id);
    }

    // Update Product stats
    product.reviews = reviewIds;
    product.averageRating = totalRating / reviewCount;
    product.reviewCount = reviewCount;
    await product.save();

    createdProducts.push(product);
  }
  
  console.log('✅ 10 Products with Reviews created');
  return createdProducts;
};

const seed = async () => {
  try {
    console.log('🚀 Starting Database Seed...');
    
    // Connect to DB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Clean Data
    await cleanData();
    
    // 2. Global Settings
    await seedGlobalSettings();

    // 3. Admin User
    const admin = await seedAdmin();

    // 4. Themes
    await seedThemes();

    // 5. Promotions & Discounts
    await seedPromotions();
    await seedDiscounts();

    // 6. Products & Reviews
    const products = await seedProductsAndReviews(admin);

    // 7. Orders
    await seedOrders(admin, products);

    // 8. Wishlist
    await seedWishlist(admin, products);

    console.log('\n=============================================');
    console.log('🎉  SEEDING COMPLETE!');
    console.log('=============================================');
    console.log('🔑  Admin Credentials:');
    console.log('    Email:    admin@demo.com');
    console.log('    Password: 123456');
    console.log('=============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seed();
