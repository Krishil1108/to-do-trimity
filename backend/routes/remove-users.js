const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');
const MOM = require('../models/MOM');
const Associate = require('../models/Associate');

/**
 * DELETE endpoint to remove specific users from the database
 * This will remove Ankit and Happy from the system
 * WARNING: This operation will also clean up related data
 */
router.delete('/remove-users', async (req, res) => {
  try {
    const usersToRemove = ['ankit', 'happy']; // Add usernames here
    
    console.log('Starting user removal process for:', usersToRemove);
    
    // Find users to get their IDs and details
    const users = await User.find({ 
      username: { $in: usersToRemove } 
    });
    
    if (users.length === 0) {
      return res.status(404).json({ 
        message: 'No users found with the specified usernames',
        searchedFor: usersToRemove
      });
    }
    
    const userIds = users.map(u => u._id);
    const usernames = users.map(u => u.username);
    
    console.log('Found users:', usernames);
    
    // Step 1: Update tasks assigned to these users (set assignee to null or reassign)
    const tasksUpdated = await Task.updateMany(
      { assignee: { $in: usernames } },
      { $set: { assignee: null } }
    );
    console.log(`Updated ${tasksUpdated.modifiedCount} tasks`);
    
    // Step 2: Update tasks created by these users
    const tasksCreatedUpdated = await Task.updateMany(
      { createdBy: { $in: usernames } },
      { $set: { createdBy: 'system' } }
    );
    console.log(`Updated ${tasksCreatedUpdated.modifiedCount} tasks (created by)`);
    
    // Step 3: Update projects where these users are members
    const projectsUpdated = await Project.updateMany(
      { members: { $in: usernames } },
      { $pull: { members: { $in: usernames } } }
    );
    console.log(`Updated ${projectsUpdated.modifiedCount} projects`);
    
    // Step 4: Update MOMs created by these users
    const momsUpdated = await MOM.updateMany(
      { createdBy: { $in: usernames } },
      { $set: { createdBy: 'system' } }
    );
    console.log(`Updated ${momsUpdated.modifiedCount} MOMs`);
    
    // Step 5: Update associates managed by these users
    const associatesUpdated = await Associate.updateMany(
      { manager: { $in: usernames } },
      { $set: { manager: null } }
    );
    console.log(`Updated ${associatesUpdated.modifiedCount} associates`);
    
    // Step 6: Update users who report to these managers
    const subordinatesUpdated = await User.updateMany(
      { manager: { $in: usernames } },
      { $set: { manager: null } }
    );
    console.log(`Updated ${subordinatesUpdated.modifiedCount} subordinates`);
    
    // Step 7: Finally, delete the users
    const deleteResult = await User.deleteMany({ 
      username: { $in: usersToRemove } 
    });
    console.log(`Deleted ${deleteResult.deletedCount} users`);
    
    res.json({
      success: true,
      message: 'Users removed successfully',
      details: {
        usersRemoved: usernames,
        deletedCount: deleteResult.deletedCount,
        tasksUpdated: tasksUpdated.modifiedCount,
        tasksCreatedUpdated: tasksCreatedUpdated.modifiedCount,
        projectsUpdated: projectsUpdated.modifiedCount,
        momsUpdated: momsUpdated.modifiedCount,
        associatesUpdated: associatesUpdated.modifiedCount,
        subordinatesUpdated: subordinatesUpdated.modifiedCount
      }
    });
    
  } catch (error) {
    console.error('Error removing users:', error);
    res.status(500).json({ 
      message: 'Error removing users', 
      error: error.message 
    });
  }
});

/**
 * GET endpoint to preview what will be affected before deletion
 */
router.get('/preview-removal', async (req, res) => {
  try {
    const usersToRemove = ['ankit', 'happy'];
    
    const users = await User.find({ 
      username: { $in: usersToRemove } 
    }).select('-password');
    
    if (users.length === 0) {
      return res.status(404).json({ 
        message: 'No users found',
        searchedFor: usersToRemove
      });
    }
    
    const usernames = users.map(u => u.username);
    
    // Count affected items
    const tasksAssigned = await Task.countDocuments({ assignee: { $in: usernames } });
    const tasksCreated = await Task.countDocuments({ createdBy: { $in: usernames } });
    const projectsAffected = await Project.countDocuments({ members: { $in: usernames } });
    const momsCreated = await MOM.countDocuments({ createdBy: { $in: usernames } });
    const associatesManaged = await Associate.countDocuments({ manager: { $in: usernames } });
    const subordinates = await User.countDocuments({ manager: { $in: usernames } });
    
    res.json({
      users: users,
      impact: {
        tasksAssigned,
        tasksCreated,
        projectsAffected,
        momsCreated,
        associatesManaged,
        subordinates
      },
      warning: 'This will permanently delete these users and update related data'
    });
    
  } catch (error) {
    res.status(500).json({ 
      message: 'Error previewing removal', 
      error: error.message 
    });
  }
});

module.exports = router;
