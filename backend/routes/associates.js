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
    if (!name || !createdBy) {
      return res.status(400).json({ 
        message: 'Name and createdBy are required' 
      });
    }
    
    // Clean email - convert empty strings to undefined
    const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : undefined;
    
    // Check if associate with this email already exists for this user (only if email is provided and not empty)
    if (cleanEmail) {
      const existingAssociate = await Associate.findOne({ 
        email: cleanEmail,
        createdBy: createdBy,
        isActive: true
      });
      
      if (existingAssociate) {
        return res.status(400).json({ 
          message: 'An associate with this email already exists' 
        });
      }
    }
    
    const associate = new Associate({
      name: name.trim(),
      company: company && company.trim() ? company.trim() : undefined,
      email: cleanEmail,
      phone: phone && phone.trim() ? phone.trim() : undefined,
      createdBy: createdBy
    });
    
    const savedAssociate = await associate.save();
    
    console.log(`✅ New associate created: ${savedAssociate.name}${savedAssociate.email ? ` (${savedAssociate.email})` : ''}`);
    
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
    
    // Clean email - convert empty strings to undefined
    const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : undefined;
    
    // Check if email is being changed to one that already exists
    if (cleanEmail && cleanEmail !== associate.email) {
      const existingAssociate = await Associate.findOne({ 
        email: cleanEmail,
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
    
    // Update fields - use undefined for empty values
    if (name) associate.name = name.trim();
    associate.company = company && company.trim() ? company.trim() : undefined;
    associate.email = cleanEmail;
    associate.phone = phone && phone.trim() ? phone.trim() : undefined;
    
    const updatedAssociate = await associate.save();
    
    console.log(`✅ Associate updated: ${updatedAssociate.name}${updatedAssociate.email ? ` (${updatedAssociate.email})` : ''}`);
    
    res.json(updatedAssociate);
  } catch (error) {
    console.error('Error updating associate:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete an associate (hard delete by default, soft delete with query param)
router.delete('/:id', async (req, res) => {
  try {
    const { soft } = req.query; // ?soft=true for soft delete
    const associate = await Associate.findById(req.params.id);
    
    if (!associate) {
      return res.status(404).json({ message: 'Associate not found' });
    }
    
    if (soft === 'true') {
      // Soft delete by setting isActive to false
      if (!associate.isActive) {
        return res.status(404).json({ message: 'Associate already deleted' });
      }
      associate.isActive = false;
      await associate.save();
      console.log(`🗑️ Associate soft deleted: ${associate.name}${associate.email ? ` (${associate.email})` : ''}`);
    } else {
      // Hard delete - permanently remove from database
      await Associate.findByIdAndDelete(req.params.id);
      console.log(`💀 Associate permanently deleted: ${associate.name}${associate.email ? ` (${associate.email})` : ''}`);
    }
    
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