const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Project = require('./models/Project');

const DEMO_USERS = [
  {
    username: 'ketul.lathia',
    password: '125478',
    name: 'Ketul Lathia',
    email: 'ketul.lathia@trido.com',
    role: 'Admin',
    department: 'Owner',
    isActive: true
  },
  {
    username: 'kinjal.solanki',
    password: '963258',
    name: 'Kinjal Solanki',
    email: 'kinjal.solanki@trido.com',
    role: 'Manager',
    department: 'Administrative',
    isActive: true
  },
  {
    username: 'vraj.patel',
    password: '741852',
    name: 'Vraj Patel',
    email: 'vraj.patel@trido.com',
    role: 'Team Lead',
    department: 'Project Management',
    isActive: true
  },
  {
    username: 'piyush.diwan',
    password: '369852',
    name: 'Piyush Diwan',
    email: 'piyush.diwan@trido.com',
    role: 'Employee',
    department: 'Studio Team',
    isActive: true
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanagement');
    console.log('📦 Connected to MongoDB');

    // Clear existing users and projects
    await User.deleteMany({});
    await Project.deleteMany({});
    console.log('🗑️  Cleared existing users and projects');

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

    // Add default projects
    const defaultProjects = [
      { name: 'Website Redesign' },
      { name: 'Mobile App' },
      { name: 'Marketing Campaign' },
      { name: 'Infrastructure' }
    ];
    await Project.insertMany(defaultProjects);
    console.log('\n✅ Added default projects: Website Redesign, Mobile App, Marketing Campaign, Infrastructure');

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
