const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Admin', 'Manager', 'Team Lead', 'Employee', 'Associate'],
    default: 'Employee'
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  department: {
    type: String,
    default: ''
  },
  manager: {
    type: String,
    default: null,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDemo: {
    type: Boolean,
    default: false
  },
  fcmToken: {
    type: String,
    default: null
  },
  pushNotificationsEnabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
