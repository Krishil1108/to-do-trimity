const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

const DEMO_USERS = [
  {
    username: 'admin',
    password: 'admin123',
    name: 'Admin User',
    email: 'admin@taskmanagement.com',
    role: 'Admin',
    department: 'Management',
    isActive: true
  },
  {
    username: 'manager1',
    password: 'manager123',
    name: 'John Manager',
    email: 'john.manager@taskmanagement.com',
    role: 'Manager',
    department: 'IT',
    isActive: true
  },
  {
    username: 'manager2',
    password: 'manager123',
    name: 'Sarah Manager',
    email: 'sarah.manager@taskmanagement.com',
    role: 'Manager',
    department: 'Sales',
    isActive: true
  },
  {
    username: 'teamlead1',
    password: 'teamlead123',
    name: 'Jane Team Lead',
    email: 'jane.teamlead@taskmanagement.com',
    role: 'Team Lead',
    department: 'IT',
    isActive: true
  },
  {
    username: 'teamlead2',
    password: 'teamlead123',
    name: 'Mike Team Lead',
    email: 'mike.teamlead@taskmanagement.com',
    role: 'Team Lead',
    department: 'Sales',
    isActive: true
  },
  {
    username: 'employee1',
    password: 'employee123',
    name: 'Bob Employee',
    email: 'bob.employee@taskmanagement.com',
    role: 'Employee',
    department: 'IT',
    isActive: true
  },
  {
    username: 'employee2',
    password: 'employee123',
    name: 'Alice Employee',
    email: 'alice.employee@taskmanagement.com',
    role: 'Employee',
    department: 'Sales',
    isActive: true
  },
  {
    username: 'employee3',
    password: 'employee123',
    name: 'Charlie Employee',
    email: 'charlie.employee@taskmanagement.com',
    role: 'Employee',
    department: 'HR',
    isActive: true
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanagement');
    console.log('📦 Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Hash passwords and insert demo users
    const usersWithHashedPasswords = await Promise.all(
      DEMO_USERS.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return {
          ...user,
          password: hashedPassword
        };
      })
    );

    await User.insertMany(usersWithHashedPasswords);
    console.log('✅ Added demo users:\n');
    console.log('┌─────────────┬──────────────────┬─────────────┬──────────────┐');
    console.log('│ Username    │ Name             │ Role        │ Password     │');
    console.log('├─────────────┼──────────────────┼─────────────┼──────────────┤');
    DEMO_USERS.forEach(user => {
      console.log(`│ ${user.username.padEnd(11)} │ ${user.name.padEnd(16)} │ ${user.role.padEnd(11)} │ ${user.password.padEnd(12)} │`);
    });
    console.log('└─────────────┴──────────────────┴─────────────┴──────────────┘');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n💡 Login with any of the above credentials');
    console.log('   Example: username: admin, password: admin123\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
