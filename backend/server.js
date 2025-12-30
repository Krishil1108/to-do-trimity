const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Atlas Connection with optimized settings for production
console.log('🔗 Attempting to connect to MongoDB Atlas...');
console.log('Connection URI:', process.env.MONGODB_URI ? 'URI provided' : 'No URI found, using fallback');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanagement', {
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
  socketTimeoutMS: 45000, // Socket timeout
  maxPoolSize: 10, // Maintain up to 10 socket connections
})
  .then(() => {
    console.log('✅ MongoDB Atlas connected successfully');
    console.log('Database name:', mongoose.connection.db.databaseName);
  })
  .catch(err => {
    console.error('❌ MongoDB Atlas connection error:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  });

// Handle MongoDB connection events
mongoose.connection.on('error', err => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// Make database available to routes
app.locals.db = mongoose.connection.db;

// Routes
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const { router: notificationRoutes } = require('./routes/notifications');
const projectRoutes = require('./routes/projects');
const associateRoutes = require('./routes/associates');
const externalUserRoutes = require('./routes/externalUsers');
const migrationRoutes = require('./routes/migration');
const twilioWhatsappRoutes = require('./routes/twilioWhatsapp');
const momRoutes = require('./routes/mom');

app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/associates', associateRoutes);
app.use('/api/external-users', externalUserRoutes);
app.use('/api/migration', migrationRoutes);
app.use('/api/twilio-whatsapp', twilioWhatsappRoutes);
app.use('/api/mom', momRoutes);

// Health check endpoints for keep-alive
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage(),
    server: 'awake'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Initialize automatic notification cleanup
  try {
    const { scheduleNotificationCleanup } = require('./services/notificationCleanup');
    scheduleNotificationCleanup();
    console.log('🧹 Notification cleanup service initialized');
  } catch (error) {
    console.error('❌ Failed to initialize notification cleanup:', error);
  }
});
