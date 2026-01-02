const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const firebaseNotificationService = require('../services/firebaseNotificationService');
const Notification = require('../models/Notification');

// Helper function to populate external user details
const populateExternalUserDetails = async (tasks) => {
  const ExternalUser = require('../models/ExternalUser');
  
  for (let task of tasks) {
    if (task.isExternalUser && task.externalUserId) {
      const externalUser = await ExternalUser.findById(task.externalUserId);
      if (externalUser) {
        task._doc.externalUserDetails = {
          name: externalUser.name,
          _id: externalUser._id
        };
      }
    }
  }
  return tasks;
};

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const { username } = req.query;
    let filter = {};
    
    if (username) {
      // Check if user is demo user
      const User = require('../models/User');
      const user = await User.findOne({ username });
      if (user && user.isDemo) {
        filter.isDemo = true; // Demo users only see demo tasks
      } else {
        filter.isDemo = { $ne: true }; // Regular users don't see demo tasks
      }
    }
    
    let tasks = await Task.find(filter).sort({ createdAt: -1 });
    
    // Populate external user details
    tasks = await populateExternalUserDetails(tasks);
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Populate external user details for single task
    const tasksWithDetails = await populateExternalUserDetails([task]);
    
    res.json(tasksWithDetails[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create task
router.post('/', async (req, res) => {
  try {
    // Clean up the request body
    const taskData = { ...req.body };
    
    // Handle empty reminder field
    if (taskData.reminder === '' || taskData.reminder === null) {
      delete taskData.reminder;
    }
    
    // Handle empty external user fields
    if (taskData.externalUserId === '' || taskData.externalUserId === null) {
      delete taskData.externalUserId;
    }
    if (!taskData.isExternalUser) {
      delete taskData.externalUserId;
      delete taskData.externalUserDetails;
    }
    
    // Check if the user creating the task is a demo user
    if (taskData.assignedBy) {
      const User = require('../models/User');
      const user = await User.findOne({ username: taskData.assignedBy });
      if (user && user.isDemo) {
        taskData.isDemo = true; // Mark task as demo if created by demo user
      }
    }
    
    const task = new Task(taskData);
    const newTask = await task.save();
    
    // Note: Push notifications are handled by frontend for better control
    // Frontend sends notifications after task creation to avoid duplicates
    
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({ message: error.message, details: error.errors });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    // Get the current task to check if status is changing to 'Completed'
    const currentTask = await Task.findById(req.params.id);
    if (!currentTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Clean up the request body
    const updateData = { ...req.body };
    
    // Handle empty reminder field
    if (updateData.reminder === '' || updateData.reminder === null) {
      delete updateData.reminder;
    }
    
    // Handle empty external user fields
    if (updateData.externalUserId === '' || updateData.externalUserId === null) {
      delete updateData.externalUserId;
    }
    if (!updateData.isExternalUser) {
      delete updateData.externalUserId;
      delete updateData.externalUserDetails;
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    // Check if task was just completed (status changed from non-Completed to Completed)
    const wasCompleted = currentTask.status !== 'Completed' && updateData.status === 'Completed';
    const statusChanged = currentTask.status !== updateData.status;
    
    // Send Firebase push notification for task completion
    // Note: Notifications are handled by frontend for better control
    // This avoids duplicate notifications and gives frontend full control
    
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(400).json({ message: error.message, details: error.errors });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
