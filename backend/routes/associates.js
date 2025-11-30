const express = require('express');
const router = express.Router();
const Associate = require('../models/Associate');

// Get all associates for the current user
router.get('/', async (req, res) => {
  try {
    const { createdBy } = req.query;
    
    if (!createdBy) {
      return res.status(400).json({ message: 'createdBy parameter is required' });
    }
    
    const associates = await Associate.find({ 
      createdBy: createdBy,
      isActive: true 
    }).sort({ name: 1 });
    
    res.json(associates);
  } catch (error) {
    console.error('Error fetching associates:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get a single associate by ID
router.get('/:id', async (req, res) => {
  try {
    const associate = await Associate.findById(req.params.id);
    
    if (!associate || !associate.isActive) {
      return res.status(404).json({ message: 'Associate not found' });
    }
    
    res.json(associate);
  } catch (error) {
    console.error('Error fetching associate:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create a new associate
router.post('/', async (req, res) => {
  try {
    const { name, company, email, phone, createdBy } = req.body;
    
    // Validate required fields
    if (!name || !company || !email || !createdBy) {
      return res.status(400).json({ 
        message: 'Name, company, email, and createdBy are required' 
      });
    }
    
    // Check if associate with this email already exists for this user
    const existingAssociate = await Associate.findOne({ 
      email: email.toLowerCase(),
      createdBy: createdBy,
      isActive: true
    });
    
    if (existingAssociate) {
      return res.status(400).json({ 
        message: 'An associate with this email already exists' 
      });
    }
    
    const associate = new Associate({
      name: name.trim(),
      company: company.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      createdBy: createdBy
    });
    
    const savedAssociate = await associate.save();
    
    console.log(`✅ New associate created: ${savedAssociate.name} (${savedAssociate.email})`);
    
    res.status(201).json(savedAssociate);
  } catch (error) {
    console.error('Error creating associate:', error);
    
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({ 
        message: 'An associate with this email already exists in the system' 
      });
    }
    
    res.status(400).json({ message: error.message });
  }
});

// Update an associate
router.put('/:id', async (req, res) => {
  try {
    const { name, company, email, phone } = req.body;
    
    const associate = await Associate.findById(req.params.id);
    
    if (!associate || !associate.isActive) {
      return res.status(404).json({ message: 'Associate not found' });
    }
    
    // Check if email is being changed to one that already exists
    if (email && email.toLowerCase() !== associate.email) {
      const existingAssociate = await Associate.findOne({ 
        email: email.toLowerCase(),
        createdBy: associate.createdBy,
        isActive: true,
        _id: { $ne: associate._id }
      });
      
      if (existingAssociate) {
        return res.status(400).json({ 
          message: 'An associate with this email already exists' 
        });
      }
    }
    
    // Update fields
    if (name) associate.name = name.trim();
    if (company) associate.company = company.trim();
    if (email) associate.email = email.toLowerCase().trim();
    if (phone !== undefined) associate.phone = phone.trim();
    
    const updatedAssociate = await associate.save();
    
    console.log(`✅ Associate updated: ${updatedAssociate.name} (${updatedAssociate.email})`);
    
    res.json(updatedAssociate);
  } catch (error) {
    console.error('Error updating associate:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete (soft delete) an associate
router.delete('/:id', async (req, res) => {
  try {
    const associate = await Associate.findById(req.params.id);
    
    if (!associate || !associate.isActive) {
      return res.status(404).json({ message: 'Associate not found' });
    }
    
    // Soft delete by setting isActive to false
    associate.isActive = false;
    await associate.save();
    
    console.log(`🗑️ Associate soft deleted: ${associate.name} (${associate.email})`);
    
    res.json({ message: 'Associate deleted successfully' });
  } catch (error) {
    console.error('Error deleting associate:', error);
    res.status(500).json({ message: error.message });
  }
});

// Search associates by name or company
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { createdBy } = req.query;
    
    if (!createdBy) {
      return res.status(400).json({ message: 'createdBy parameter is required' });
    }
    
    const associates = await Associate.find({
      createdBy: createdBy,
      isActive: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { company: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).sort({ name: 1 });
    
    res.json(associates);
  } catch (error) {
    console.error('Error searching associates:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;