const mongoose = require('mongoose');
require('dotenv').config();

const Project = require('./models/Project');

const PRODUCTION_PROJECTS = [
  { name: 'Nakshtra Routes' },
  { name: 'Hastinapur' },
  { name: 'Profile working' },
  { name: 'Occura hospital' },
  { name: 'Hirenbhai Bungalow R+R' },
  { name: 'Sagar bhai Bungalow' },
  { name: 'jamnagar sp office' },
  { name: 'aurum phase 3' },
  { name: 'kevin patel bungalow' },
  { name: 'RVA hospital' },
  { name: 'Zydus medtech' },
  { name: 'General' },
  { name: 'Ambali 66' },
  { name: 'Paliwal' },
  { name: 'Deepbhai Bungalow' },
  { name: 'Sagarbhai Bungalow' }
];

async function addProjects() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanagement');
    console.log('📦 Connected to MongoDB');

    // Get existing projects
    const existingProjects = await Project.find({});
    const existingNames = existingProjects.map(p => p.name);

    // Filter out projects that already exist
    const newProjects = PRODUCTION_PROJECTS.filter(p => !existingNames.includes(p.name));

    if (newProjects.length > 0) {
      await Project.insertMany(newProjects);
      console.log(`✅ Added ${newProjects.length} new projects:`);
      newProjects.forEach(p => console.log(`   - ${p.name}`));
    } else {
      console.log('ℹ️  All projects already exist');
    }

    console.log(`\n📊 Total projects in database: ${existingProjects.length + newProjects.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding projects:', error);
    process.exit(1);
  }
}

addProjects();
