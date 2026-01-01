const mongoose = require('mongoose');

const momSchema = new mongoose.Schema({
  // Task reference
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  
  // MOM details
  title: {
    type: String,
    default: 'Minutes of Meeting'
  },
  
  date: {
    type: Date,
    default: Date.now
  },
  
  visitDate: {
    type: String,
    required: true
  },
  
  location: {
    type: String,
    default: 'Routine'
  },
  
  // Attendees
  attendees: [{
    name: String
  }],
  
  // Content
  rawContent: {
    type: String,
    required: true
  },
  
  processedContent: {
    type: String,
    required: true
  },
  
  // PDF info
  pdfPath: {
    type: String
  },
  
  pdfFilename: {
    type: String
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  companyName: {
    type: String,
    default: 'Trimity Consultants'
  }
}, {
  timestamps: true
});

// Index for faster queries
momSchema.index({ taskId: 1, createdAt: -1 });

module.exports = mongoose.model('MOM', momSchema);
