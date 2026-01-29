const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function listUsers() {
  try {
    const MONGODB_URI = 'mongodb+srv://krishildoctecq:Krishil%401129@cluster0.nqjscoy.mongodb.net/taskmanagement?retryWrites=true&w=majority';
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB Atlas\n');

    const users = await User.find({}).select('username name email department role isActive');
    
    console.log(`Total users: ${users.length}\n`);
    console.log('All users in database:');
    console.log('='.repeat(80));
    
    users.forEach(u => {
      console.log(`Username: ${u.username.padEnd(20)} | Name: ${u.name.padEnd(25)} | Dept: ${(u.department || 'N/A').padEnd(20)} | Active: ${u.isActive}`);
    });
    
    console.log('='.repeat(80));
    
    // Look for variations
    const ankitUsers = users.filter(u => u.username.toLowerCase().includes('ankit') || u.name.toLowerCase().includes('ankit'));
    const happyUsers = users.filter(u => u.username.toLowerCase().includes('happy') || u.name.toLowerCase().includes('happy'));
    
    if (ankitUsers.length > 0) {
      console.log('\n🔍 Found users with "ankit":');
      ankitUsers.forEach(u => console.log(`   - ${u.username} (${u.name})`));
    }
    
    if (happyUsers.length > 0) {
      console.log('\n🔍 Found users with "happy":');
      happyUsers.forEach(u => console.log(`   - ${u.username} (${u.name})`));
    }
    
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

listUsers();
