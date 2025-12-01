const express = require('express');
const router = express.Router();
const Associate = require('../models/Associate');

// Migration endpoint to fix email indexes
router.post('/fix-indexes', async (req, res) => {
  try {
    console.log('🔧 Starting database migration for associates...');
    
    const collection = req.app.locals.db.collection('associates');
    const results = {
      steps: [],
      success: false
    };

    // Step 1: Drop old indexes
    try {
      const indexes = await collection.indexes();
      results.steps.push(`Found ${indexes.length} indexes`);
      
      for (const index of indexes) {
        if (index.key.email !== undefined && index.name !== '_id_') {
          await collection.dropIndex(index.name);
          results.steps.push(`✅ Dropped index: ${index.name}`);
        }
      }
    } catch (error) {
      results.steps.push(`ℹ️ Index drop: ${error.message}`);
    }

    // Step 2: Update documents with empty strings to null
    const updateResult = await collection.updateMany(
      { 
        $or: [
          { email: '' },
          { email: { $exists: false } }
        ]
      },
      { $set: { email: null } }
    );
    results.steps.push(`✅ Updated ${updateResult.modifiedCount} documents with empty emails to null`);

    // Update company and phone too
    await collection.updateMany(
      { $or: [{ company: '' }, { company: { $exists: false } }] },
      { $set: { company: null } }
    );
    await collection.updateMany(
      { $or: [{ phone: '' }, { phone: { $exists: false } }] },
      { $set: { phone: null } }
    );
    results.steps.push('✅ Updated company and phone fields');

    // Step 3: Create partial unique index
    try {
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
      results.steps.push('✅ Created partial unique index on email');
    } catch (error) {
      results.steps.push(`ℹ️ Index creation: ${error.message}`);
    }

    // Step 4: Create sparse index
    try {
      await collection.createIndex(
        { email: 1 },
        { sparse: true, name: 'email_sparse' }
      );
      results.steps.push('✅ Created sparse index on email');
    } catch (error) {
      results.steps.push(`ℹ️ Sparse index: ${error.message}`);
    }

    // Step 5: Summary
    const total = await Associate.countDocuments();
    const withEmail = await collection.countDocuments({ 
      email: { $ne: null, $ne: '', $exists: true } 
    });
    const withoutEmail = total - withEmail;

    results.summary = {
      total,
      withEmail,
      withoutEmail
    };
    results.steps.push(`📊 Total: ${total}, With email: ${withEmail}, Without email: ${withoutEmail}`);

    // Get final indexes
    const finalIndexes = await collection.indexes();
    results.indexes = finalIndexes.map(idx => idx.name);
    results.steps.push(`📋 Active indexes: ${results.indexes.join(', ')}`);

    results.success = true;
    results.message = '✅ Migration completed successfully! You can now add associates without email.';

    console.log('✅ Migration completed successfully');
    res.json(results);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed: ' + error.message,
      error: error.toString()
    });
  }
});

module.exports = router;
