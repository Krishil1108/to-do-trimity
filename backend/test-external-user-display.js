const mongoose = require('mongoose');
const Task = require('./models/Task');
const ExternalUser = require('./models/ExternalUser');
require('dotenv').config();

async function testExternalUserDisplay() {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanagement');
    console.log('✅ Connected to MongoDB Atlas');

    // Create a test external user
    console.log('\n📝 Creating test external user...');
    const testExternalUser = new ExternalUser({
      name: 'John Doe (External)',
      createdBy: 'test-user-123'
    });
    const savedExternalUser = await testExternalUser.save();
    console.log('✅ External user created:', savedExternalUser.name);

    // Create a test task with external user
    console.log('\n📝 Creating test task with external user...');
    const testTask = new Task({
      title: 'Test Task for External User',
      description: 'Testing external user display',
      assignedTo: 'External User',
      isExternalUser: true,
      externalUserId: savedExternalUser._id,
      assignedBy: 'test-user-123',
      project: 'Test Project',
      status: 'Pending',
      priority: 'Medium',
      inDate: new Date(),
      outDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });
    const savedTask = await testTask.save();
    console.log('✅ Task created with external user:', savedTask._id);

    // Test the population function (simulate what the API does)
    console.log('\n🔍 Testing external user details population...');
    
    // Helper function to populate external user details (copied from routes/tasks.js)
    const populateExternalUserDetails = async (tasks) => {
      for (let task of tasks) {
        if (task.isExternalUser && task.externalUserId) {
          const externalUser = await ExternalUser.findById(task.externalUserId);
          if (externalUser) {
            task._doc.externalUserDetails = {
              name: externalUser.name,
              _id: externalUser._id
            };
          }
        }
      }
      return tasks;
    };

    let tasks = await Task.find({ _id: savedTask._id });
    console.log('📋 Task before population:', {
      title: tasks[0].title,
      isExternalUser: tasks[0].isExternalUser,
      externalUserId: tasks[0].externalUserId,
      externalUserDetails: tasks[0].externalUserDetails
    });

    tasks = await populateExternalUserDetails(tasks);
    console.log('📋 Task after population:', {
      title: tasks[0].title,
      isExternalUser: tasks[0].isExternalUser,
      externalUserId: tasks[0].externalUserId,
      externalUserDetails: tasks[0].externalUserDetails
    });

    // Cleanup
    await Task.deleteOne({ _id: savedTask._id });
    await ExternalUser.deleteOne({ _id: savedExternalUser._id });
    console.log('🧹 Cleaned up test data');

    if (tasks[0].externalUserDetails && tasks[0].externalUserDetails.name === 'John Doe (External)') {
      console.log('\n🎉 SUCCESS: External user name population is working correctly!');
    } else {
      console.log('\n❌ FAILURE: External user name population is not working');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔐 Database connection closed');
  }
}

testExternalUserDisplay();