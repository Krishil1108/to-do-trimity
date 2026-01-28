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
  isExternalUser: {
    type: Boolean,
    default: false
  },
  externalUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExternalUser',
    required: false,
    default: null
  },
  externalUserDetails: {
    name: { type: String, default: '' },
    _id: { type: mongoose.Schema.Types.ObjectId }
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
    enum: ['Pending', 'In Progress', 'In Checking', 'Completed', 'Overdue'],
    default: 'Pending'
  },
  isConfidential: {
    type: Boolean,
    default: false
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
  },
  parentTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  subtasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  isSubtask: {
    type: Boolean,
    default: false
  },
  isDemo: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);
