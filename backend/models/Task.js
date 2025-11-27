const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  project: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  severity: {
    type: String,
    enum: ['Minor', 'Major', 'Critical'],
    default: 'Minor'
  },
  inDate: {
    type: Date,
    required: true
  },
  outDate: {
    type: Date,
    required: true
  },
  team: {
    type: String,
    required: false,
    default: ''
  },
  associates: {
    type: [String],
    default: []
  },
  assignedBy: {
    type: String,
    required: true
  },
  assignedTo: {
    type: String,
    required: true
  },
  isAssociate: {
    type: Boolean,
    default: false
  },
  associateDetails: {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    company: { type: String, default: '' }
  },
  reminder: {
    type: Date
  },
  whatsapp: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Overdue'],
    default: 'Pending'
  },
  completionReason: {
    type: String,
    default: ''
  },
  overdueReason: {
    type: String,
    default: ''
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);
