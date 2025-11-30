const mongoose = require('mongoose');

const associateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  phone: {
    type: String,
    trim: true
  },
  createdBy: {
    type: String,
    required: true // User who created this associate
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add index for faster queries
associateSchema.index({ email: 1 });
associateSchema.index({ createdBy: 1 });
associateSchema.index({ company: 1 });

module.exports = mongoose.model('Associate', associateSchema);