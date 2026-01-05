// Script to create test users directly in MongoDB
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./models/User');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create users
const createUsers = async () => {
  try {
    // Check if users already exist
    const existingTest1 = await User.findOne({ username: 'test1' });
    const existingTest2 = await User.findOne({ username: 'test2' });

    if (existingTest1) {
      console.log('⚠️  test1 user already exists, skipping...');
    } else {
      // Create test1
      const hashedPassword1 = await bcrypt.hash('test1', 10);
      const user1 = new User({
        username: 'test1',
        password: hashedPassword1,
        name: 'Test User 1',
        email: 'test1@trimity.com',
        role: 'Admin',
        department: 'Management',
        isActive: true
      });
      await user1.save();
      console.log('✅ test1 created successfully!');
      console.log('   Username: test1');
      console.log('   Password: test1');
      console.log('   Role: Admin');
      console.log('');
    }

    if (existingTest2) {
      console.log('⚠️  test2 user already exists, skipping...');
    } else {
      // Create test2
      const hashedPassword2 = await bcrypt.hash('test2', 10);
      const user2 = new User({
        username: 'test2',
        password: hashedPassword2,
        name: 'Test User 2',
        email: 'test2@trimity.com',
        role: 'Admin',
        department: 'Management',
        isActive: true
      });
      await user2.save();
      console.log('✅ test2 created successfully!');
      console.log('   Username: test2');
      console.log('   Password: test2');
      console.log('   Role: Admin');
      console.log('');
    }

    console.log('🎉 Done! Test users have been created with Admin rights.');
    console.log('');
    console.log('You can now log in with:');
    console.log('  - Username: test1, Password: test1');
    console.log('  - Username: test2, Password: test2');
  } catch (error) {
    console.error('❌ Error creating users:', error.message);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
(async () => {
  await connectDB();
  await createUsers();
})();
