const mongoose = require('mongoose');

const associateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    trim: true,
    default: null
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    default: null,
    validate: {
      validator: function(v) {
        // Only validate if email is provided and not null
        return !v || v === null || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  phone: {
    type: String,
    trim: true,
    default: null
  },
  createdBy: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Partial unique index - only enforces uniqueness when email is not null
associateSchema.index(
  { email: 1, createdBy: 1 },
  { 
    unique: true,
    partialFilterExpression: { 
      email: { $type: 'string', $exists: true, $gt: '' }
    }
  }
);

// Regular indexes for queries
associateSchema.index({ createdBy: 1 });
associateSchema.index({ company: 1 });
associateSchema.index({ isActive: 1 });

module.exports = mongoose.model('Associate', associateSchema);