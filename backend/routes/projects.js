const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ name: 1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new project
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    // Check if project already exists
    const existingProject = await Project.findOne({ name: name.trim() });
    if (existingProject) {
      return res.status(400).json({ message: 'Project already exists' });
    }

    const project = new Project({ name: name.trim() });
    const savedProject = await project.save();
    res.status(201).json(savedProject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a project
router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    
    // Check if new name already exists (excluding current project)
    const existingProject = await Project.findOne({ 
      name: name.trim(), 
      _id: { $ne: req.params.id } 
    });
    
    if (existingProject) {
      return res.status(400).json({ message: 'Project with this name already exists' });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a project
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully', project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
