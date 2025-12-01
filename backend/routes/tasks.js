const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
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
    res.json(task);
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
    
    const task = new Task(taskData);
    const newTask = await task.save();
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({ message: error.message, details: error.errors });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    // Clean up the request body
    const updateData = { ...req.body };
    
    // Handle empty reminder field
    if (updateData.reminder === '' || updateData.reminder === null) {
      delete updateData.reminder;
    }
    
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
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
