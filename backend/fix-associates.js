const mongoose = require('mongoose');
require('dotenv').config();

const Associate = require('./models/Associate');

async function fixAssociates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanagement', {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4
    });

    console.log('✅ Connected to MongoDB');

    const collection = mongoose.connection.collection('associates');

    // 1. Drop ALL indexes on email field (including unique ones)
    try {
      const indexes = await collection.indexes();
      console.log('📋 Current indexes:', indexes.map(i => i.name));

      for (const index of indexes) {
        if (index.key.email !== undefined && index.name !== '_id_') {
          console.log('🗑️ Dropping index:', index.name);
          await collection.dropIndex(index.name);
        }
      }
      console.log('✅ All email indexes dropped');
    } catch (error) {
      console.log('ℹ️ No email indexes to drop or error:', error.message);
    }

    // 2. Update ALL associates: convert empty strings to null (MongoDB treats null differently than undefined)
    const updateResult = await collection.updateMany(
      { 
        $or: [
          { email: '' },
          { email: { $exists: false } }
        ]
      },
      {
        $set: { email: null }
      }
    );
    console.log(`✅ Updated ${updateResult.modifiedCount} associates with empty/missing emails to null`);

    // Do the same for company and phone
    await collection.updateMany(
      { $or: [{ company: '' }, { company: { $exists: false } }] },
      { $set: { company: null } }
    );
    
    await collection.updateMany(
      { $or: [{ phone: '' }, { phone: { $exists: false } }] },
      { $set: { phone: null } }
    );
    console.log('✅ Updated company and phone fields');

    // 3. Create a partial unique index - only indexes non-null emails
    await collection.createIndex(
      { email: 1, createdBy: 1 },
      { 
        unique: true,
        partialFilterExpression: { 
          email: { $type: 'string', $ne: null, $ne: '' } 
        },
        name: 'email_createdBy_unique_partial'
      }
    );
    console.log('✅ Created partial unique index on email (only for non-null/non-empty emails)');

    // 4. Recreate the sparse index for queries
    await collection.createIndex(
      { email: 1 },
      { 
        sparse: true,
        name: 'email_sparse'
      }
    );
    console.log('✅ Created sparse index on email field');

    // 5. Show summary
    const total = await Associate.countDocuments();
    const withEmail = await collection.countDocuments({ 
      email: { $ne: null, $ne: '', $exists: true } 
    });
    const withoutEmail = total - withEmail;

    console.log('\n📊 Summary:');
    console.log(`   Total associates: ${total}`);
    console.log(`   With email: ${withEmail}`);
    console.log(`   Without email (null): ${withoutEmail}`);

    // 6. Show final indexes
    const finalIndexes = await collection.indexes();
    console.log('\n📋 Final indexes:');
    finalIndexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\n✅ Migration complete! You can now add associates without email.');
    console.log('💡 Only associates with actual email addresses will be checked for duplicates.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

fixAssociates();
