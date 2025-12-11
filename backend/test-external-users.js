const mongoose = require('mongoose');
const ExternalUser = require('./models/ExternalUser');
require('dotenv').config();

async function testExternalUsers() {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanagement');
    console.log('✅ Connected to MongoDB Atlas');
    console.log('Database name:', mongoose.connection.db.databaseName);

    // Test creating an external user
    console.log('\n📝 Testing external user creation...');
    const testUser = new ExternalUser({
      name: 'Test External User',
      createdBy: 'test-user-123'
    });

    const savedUser = await testUser.save();
    console.log('✅ External user created:', savedUser);

    // Test fetching external users
    console.log('\n🔍 Testing external user retrieval...');
    const allUsers = await ExternalUser.find({ createdBy: 'test-user-123' });
    console.log('✅ Found external users:', allUsers);

    // Cleanup test data
    await ExternalUser.deleteMany({ createdBy: 'test-user-123' });
    console.log('🧹 Cleaned up test data');

    console.log('\n🎉 All tests passed! External users functionality is working.');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔐 Database connection closed');
  }
}

testExternalUsers();