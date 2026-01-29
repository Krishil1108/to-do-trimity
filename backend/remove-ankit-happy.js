/**
 * Script to remove Ankit and Happy users from the database
 * 
 * This script can be executed in two ways:
 * 
 * Option 1: Via API endpoint (Recommended)
 * =========================================
 * 1. Start your backend server
 * 2. Preview the impact: GET http://localhost:5000/api/admin/preview-removal
 * 3. Execute removal: DELETE http://localhost:5000/api/admin/remove-users
 * 
 * Example using curl:
 * # Preview
 * curl http://localhost:5000/api/admin/preview-removal
 * 
 * # Execute
 * curl -X DELETE http://localhost:5000/api/admin/remove-users
 * 
 * 
 * Option 2: Direct MongoDB script
 * ================================
 * Run this script directly with Node.js:
 * node remove-ankit-happy.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Task = require('./models/Task');
const Project = require('./models/Project');
const MOM = require('./models/MOM');
const Associate = require('./models/Associate');

async function removeUsers() {
  try {
    // Connect to MongoDB Atlas
    console.log('🔗 Connecting to MongoDB Atlas...');
    const MONGODB_URI = 'mongodb+srv://krishildoctecq:Krishil%401129@cluster0.nqjscoy.mongodb.net/taskmanagement?retryWrites=true&w=majority';
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB Atlas\n');

    const usersToRemove = ['ankit', 'happy'];
    
    // Step 1: Preview what will be affected
    console.log('📊 Previewing impact...\n');
    const users = await User.find({ 
      username: { $in: usersToRemove } 
    }).select('-password');
    
    if (users.length === 0) {
      console.log('❌ No users found with usernames:', usersToRemove.join(', '));
      await mongoose.disconnect();
      return;
    }
    
    console.log('👥 Users to be removed:');
    users.forEach(u => {
      console.log(`   - ${u.name} (${u.username}) - ${u.department} - ${u.role}`);
    });
    console.log();
    
    const usernames = users.map(u => u.username);
    const userIds = users.map(u => u._id);
    
    // Count impact
    const tasksAssigned = await Task.countDocuments({ assignee: { $in: usernames } });
    const tasksCreated = await Task.countDocuments({ createdBy: { $in: userIds } });
    const projectsAffected = await Project.countDocuments({ members: { $in: usernames } });
    const momsCreated = await MOM.countDocuments({ createdBy: { $in: userIds } });
    const associatesManaged = await Associate.countDocuments({ manager: { $in: usernames } });
    const subordinates = await User.countDocuments({ manager: { $in: usernames } });
    
    console.log('📈 Impact Analysis:');
    console.log(`   - Tasks assigned to these users: ${tasksAssigned}`);
    console.log(`   - Tasks created by these users: ${tasksCreated}`);
    console.log(`   - Projects with these users as members: ${projectsAffected}`);
    console.log(`   - MOMs created by these users: ${momsCreated}`);
    console.log(`   - Associates managed by these users: ${associatesManaged}`);
    console.log(`   - Users reporting to these managers: ${subordinates}`);
    console.log();
    
    // Confirm before proceeding
    console.log('⚠️  WARNING: This will permanently delete these users!');
    console.log('Proceeding with deletion...\n');
    
    // PERFORMING THE DELETION
    console.log('🗑️  Starting deletion process...\n');
    
    // Update tasks assigned to these users
    const tasksUpdated = await Task.updateMany(
      { assignee: { $in: usernames } },
      { $set: { assignee: null } }
    );
    console.log(`✓ Updated ${tasksUpdated.modifiedCount} tasks (assignee set to null)`);
    
    // Update tasks created by these users
    const tasksCreatedUpdated = await Task.updateMany(
      { createdBy: { $in: userIds } },
      { $set: { createdBy: null } }
    );
    console.log(`✓ Updated ${tasksCreatedUpdated.modifiedCount} tasks (createdBy set to 'system')`);
    
    // Update projects
    const projectsUpdated = await Project.updateMany(
      { members: { $in: usernames } },
      { $pull: { members: { $in: usernames } } }
    );
    console.log(`✓ Updated ${projectsUpdated.modifiedCount} projects (removed from members)`);
    
    // Update MOMs
    const momsUpdated = await MOM.updateMany(
      { createdBy: { $in: userIds } },
      { $set: { createdBy: null } }
    );
    console.log(`✓ Updated ${momsUpdated.modifiedCount} MOMs (createdBy set to 'system')`);
    
    // Update associates
    const associatesUpdated = await Associate.updateMany(
      { manager: { $in: usernames } },
      { $set: { manager: null } }
    );
    console.log(`✓ Updated ${associatesUpdated.modifiedCount} associates (manager set to null)`);
    
    // Update subordinates
    const subordinatesUpdated = await User.updateMany(
      { manager: { $in: usernames } },
      { $set: { manager: null } }
    );
    console.log(`✓ Updated ${subordinatesUpdated.modifiedCount} subordinates (manager set to null)`);
    
    // Delete the users
    const deleteResult = await User.deleteMany({ 
      username: { $in: usersToRemove } 
    });
    console.log(`✓ Deleted ${deleteResult.deletedCount} users\n`);
    
    console.log('✅ User removal completed successfully!');
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
removeUsers();
