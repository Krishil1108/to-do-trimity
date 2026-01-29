const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Task = require('./models/Task');
const Project = require('./models/Project');
const MOM = require('./models/MOM');
const Associate = require('./models/Associate');

async function verifyRemoval() {
  try {
    const MONGODB_URI = 'mongodb+srv://krishildoctecq:Krishil%401129@cluster0.nqjscoy.mongodb.net/taskmanagement?retryWrites=true&w=majority';
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB Atlas\n');

    const usersToCheck = ['ankit', 'happy'];
    
    console.log('🔍 Comprehensive verification for Ankit and Happy removal:\n');
    console.log('='.repeat(70));
    
    // 1. Check Users collection
    const users = await User.find({ 
      username: { $in: usersToCheck } 
    });
    console.log(`\n1️⃣  USERS Collection:`);
    console.log(`   Found ${users.length} users with usernames: ${usersToCheck.join(', ')}`);
    if (users.length > 0) {
      console.log('   ❌ STILL EXIST:');
      users.forEach(u => console.log(`      - ${u.username} (${u.name})`));
    } else {
      console.log('   ✅ No users found - Successfully removed!');
    }
    
    // 2. Check Tasks - assigned to
    const tasksAssigned = await Task.find({ 
      assignee: { $in: usersToCheck } 
    });
    console.log(`\n2️⃣  TASKS Collection (assignee):`);
    console.log(`   Found ${tasksAssigned.length} tasks assigned to: ${usersToCheck.join(', ')}`);
    if (tasksAssigned.length > 0) {
      console.log('   ❌ STILL REFERENCED:');
      tasksAssigned.forEach(t => console.log(`      - Task: ${t.title} | Assignee: ${t.assignee}`));
    } else {
      console.log('   ✅ No tasks assigned to these users');
    }
    
    // 3. Check Tasks - created by (needs to check by name or other identifier)
    const tasksWithAnkitHappy = await Task.find({
      $or: [
        { createdBy: /ankit/i },
        { createdBy: /happy/i }
      ]
    });
    console.log(`\n3️⃣  TASKS Collection (createdBy - text search):`);
    console.log(`   Found ${tasksWithAnkitHappy.length} tasks with 'ankit' or 'happy' in createdBy`);
    if (tasksWithAnkitHappy.length > 0) {
      console.log('   ⚠️  Found references:');
      tasksWithAnkitHappy.forEach(t => console.log(`      - Task: ${t.title} | CreatedBy: ${t.createdBy}`));
    } else {
      console.log('   ✅ No tasks with these names in createdBy');
    }
    
    // 4. Check Projects - members
    const projects = await Project.find({ 
      members: { $in: usersToCheck } 
    });
    console.log(`\n4️⃣  PROJECTS Collection (members):`);
    console.log(`   Found ${projects.length} projects with these users as members`);
    if (projects.length > 0) {
      console.log('   ❌ STILL REFERENCED:');
      projects.forEach(p => console.log(`      - Project: ${p.name} | Members: ${p.members.join(', ')}`));
    } else {
      console.log('   ✅ No projects with these users');
    }
    
    // 5. Check Associates - manager
    const associates = await Associate.find({ 
      manager: { $in: usersToCheck } 
    });
    console.log(`\n5️⃣  ASSOCIATES Collection (manager):`);
    console.log(`   Found ${associates.length} associates managed by these users`);
    if (associates.length > 0) {
      console.log('   ❌ STILL REFERENCED:');
      associates.forEach(a => console.log(`      - Associate: ${a.name} | Manager: ${a.manager}`));
    } else {
      console.log('   ✅ No associates with these managers');
    }
    
    // 6. Check Users - manager (subordinates)
    const subordinates = await User.find({ 
      manager: { $in: usersToCheck } 
    });
    console.log(`\n6️⃣  USERS Collection (manager field):`);
    console.log(`   Found ${subordinates.length} users reporting to these managers`);
    if (subordinates.length > 0) {
      console.log('   ❌ STILL REFERENCED:');
      subordinates.forEach(u => console.log(`      - User: ${u.name} (${u.username}) | Manager: ${u.manager}`));
    } else {
      console.log('   ✅ No users reporting to these managers');
    }
    
    // 7. Check MOMs - text search in content
    const momsWithContent = await MOM.find({
      $or: [
        { rawContent: /ankit/i },
        { rawContent: /happy/i },
        { processedContent: /ankit/i },
        { processedContent: /happy/i }
      ]
    });
    console.log(`\n7️⃣  MOM Collection (content search):`);
    console.log(`   Found ${momsWithContent.length} MOMs with 'ankit' or 'happy' in content`);
    if (momsWithContent.length > 0) {
      console.log('   ℹ️  Note: These are just mentions in MOM content, not user references:');
      momsWithContent.slice(0, 5).forEach(m => console.log(`      - MOM: ${m.title} | Date: ${m.date}`));
      if (momsWithContent.length > 5) {
        console.log(`      ... and ${momsWithContent.length - 5} more`);
      }
    } else {
      console.log('   ✅ No MOMs with these names in content');
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 SUMMARY:');
    const totalReferences = users.length + tasksAssigned.length + projects.length + 
                           associates.length + subordinates.length;
    
    if (totalReferences === 0) {
      console.log('✅ SUCCESS! Ankit and Happy have been completely removed from all collections!');
      console.log('   No user records, task assignments, project memberships, or management references found.');
    } else {
      console.log('❌ WARNING! Found remaining references:');
      console.log(`   - User records: ${users.length}`);
      console.log(`   - Task assignments: ${tasksAssigned.length}`);
      console.log(`   - Project memberships: ${projects.length}`);
      console.log(`   - Associate management: ${associates.length}`);
      console.log(`   - Subordinates: ${subordinates.length}`);
    }
    
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

verifyRemoval();
