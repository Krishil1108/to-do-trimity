const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Task = require('../models/Task');
const MOM = require('../models/MOM');
const textProcessingService = require('../services/textProcessingService');
const wordTemplatePdfService = require('../services/wordTemplatePdfService');

// Create temp directory for documents if it doesn't exist
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * POST /api/mom/process-text
 * Process raw MOM text (translate and improve)
 */
router.post('/process-text', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    const result = await textProcessingService.processMOMText(text);

    res.json({
      success: true,
      message: 'Text processed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error processing text:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process text'
    });
  }
});

/**
 * POST /api/mom/save
 * Save MOM to history without generating document
 */
router.post('/save', async (req, res) => {
  try {
    const {
      taskId,
      title = 'Minutes of Meeting',
      date,
      time,
      location,
      attendees = [],
      rawContent,
      companyName
    } = req.body;

    if (!rawContent || rawContent.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Meeting content is required'
      });
    }

    // Get task details if taskId provided
    let taskTitle = null;
    if (taskId) {
      try {
        const task = await Task.findById(taskId);
        if (task) {
          taskTitle = task.title;
        }
      } catch (err) {
        console.log('Task not found, continuing without task details');
      }
    }

    // Process the text (translate and improve)
    console.log('📝 Processing MOM content for save...');
    const processedResult = await textProcessingService.processMOMText(rawContent);
    
    if (!processedResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to process MOM content'
      });
    }

    // Save MOM to database
    const momRecord = new MOM({
      taskId,
      title: taskTitle || title,
      visitDate: date || new Date().toLocaleDateString('en-IN'),
      location,
      attendees: attendees.map(a => ({ name: typeof a === 'string' ? a : a.name })),
      rawContent,
      processedContent: processedResult.processedText || rawContent,
      companyName: companyName || 'Trimity Consultants'
    });
    
    const savedMom = await momRecord.save();
    console.log('✅ MOM saved to database:', savedMom._id);

    res.json({
      success: true,
      message: 'MOM saved successfully to history',
      data: {
        momId: savedMom._id,
        processedText: processedResult.processedText
      }
    });

  } catch (error) {
    console.error('Error saving MOM:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save MOM'
    });
  }
});

/**
 * POST /api/mom/generate-docx-from-template
 * Generate MOM as Word document (DOCX) from template
 */
router.post('/generate-docx-from-template', async (req, res) => {
  try {
    const {
      taskId,
      title = 'Minutes of Meeting',
      date,
      time,
      location,
      attendees = [],
      rawContent,
      companyName,
      templateName = 'letterhead.docx'
    } = req.body;

    if (!rawContent || rawContent.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Meeting content is required'
      });
    }

    // Get task details if taskId provided
    let taskTitle = null;
    if (taskId) {
      try {
        const task = await Task.findById(taskId);
        if (task) {
          taskTitle = task.title;
        }
      } catch (err) {
        console.log('Task not found, continuing without task details');
      }
    }

    // Process the text (translate and improve)
    console.log('📝 Processing MOM content for Word template...');
    const processedResult = await textProcessingService.processMOMText(rawContent);
    
    if (!processedResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to process MOM content'
      });
    }

    console.log('✅ Content processed successfully');

    // Prepare filename and path
    const filename = wordTemplatePdfService.generateFilename(
      taskId || 'general',
      taskTitle || title
    ).replace('.pdf', '.docx'); // Change extension to .docx
    const outputPath = path.join(tempDir, filename);

    // Prepare data for Word template
    const momData = {
      title,
      date: date || new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time,
      location,
      attendees,
      content: processedResult.processedText || rawContent,
      taskTitle,
      taskId,
      companyName: companyName || 'Trimity Consultants'
    };

    // Save MOM to database
    let momRecordId = null;
    try {
      const momRecord = new MOM({
        taskId,
        title: taskTitle || title,
        visitDate: date || new Date().toLocaleDateString('en-IN'),
        location,
        attendees: attendees.map(a => ({ name: typeof a === 'string' ? a : a.name })),
        rawContent,
        processedContent: processedResult.processedText || rawContent,
        companyName: companyName || 'Trimity Consultants'
      });
      
      const savedMom = await momRecord.save();
      momRecordId = savedMom._id;
      console.log('✅ MOM saved to database:', momRecordId);
    } catch (dbError) {
      console.error('⚠️  Failed to save MOM to database:', dbError);
    }

    // Generate DOCX from Word template (without PDF conversion)
    try {
      console.log('📄 Generating DOCX from Word template...');
      
      const templatePath = path.join(__dirname, '../templates', templateName);
      if (!fs.existsSync(templatePath)) {
        throw new Error('Template not found: ' + templatePath);
      }

      const Docxtemplater = require('docxtemplater');
      const PizZip = require('pizzip');
      
      // Read template
      const content = fs.readFileSync(templatePath, 'binary');
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Prepare template data
      const templateData = wordTemplatePdfService.prepareTemplateData(momData);
      doc.setData(templateData);
      doc.render();

      // Generate DOCX buffer
      const buf = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });

      // Save DOCX file
      fs.writeFileSync(outputPath, buf);
      console.log('✅ DOCX generated successfully');
    } catch (docxError) {
      console.error('❌ DOCX generation failed:', docxError.message);
      
      if (docxError.message.includes('Template not found')) {
        return res.status(404).json({
          success: false,
          error: 'Word template not found',
          message: 'Please create a Word template file named "letterhead.docx" in the backend/templates/ folder.',
          momId: momRecordId
        });
      }

      return res.status(500).json({
        success: false,
        error: 'DOCX generation failed',
        details: docxError.message,
        momId: momRecordId
      });
    }

    // Send DOCX as download
    res.download(outputPath, filename, (err) => {
      if (err) {
        console.error('Error sending DOCX:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Failed to download DOCX'
          });
        }
      }

      // Clean up: Delete the DOCX after sending
      setTimeout(() => {
        try {
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
            console.log('🗑️  Temporary DOCX deleted:', filename);
          }
        } catch (cleanupError) {
          console.error('Error deleting temporary DOCX:', cleanupError);
        }
      }, 5000);
    });

  } catch (error) {
    console.error('Error generating DOCX from template:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate DOCX from template'
    });
  }
});

/**
 * GET /api/mom/history/:taskId
 * Get all MOMs for a specific task
 */
router.get('/history/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    const moms = await MOM.find({ taskId })
      .sort({ createdAt: -1 })
      .select('-rawContent -processedContent');

    const task = await Task.findById(taskId);

    res.json({
      success: true,
      data: {
        task: task ? { _id: task._id, title: task.title } : null,
        moms,
        count: moms.length
      }
    });
  } catch (error) {
    console.error('Error fetching MOM history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch MOM history'
    });
  }
});

/**
 * GET /api/mom/tasks-with-moms
 * Get all tasks that have MOMs
 */
router.get('/tasks-with-moms', async (req, res) => {
  try {
    const tasksWithMoms = await MOM.aggregate([
      {
        $group: {
          _id: '$taskId',
          momCount: { $sum: 1 },
          lastMomDate: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: '_id',
          as: 'taskDetails'
        }
      },
      {
        $unwind: '$taskDetails'
      },
      {
        $project: {
          taskId: '$_id',
          taskTitle: '$taskDetails.title',
          taskStatus: '$taskDetails.status',
          momCount: 1,
          lastMomDate: 1
        }
      },
      {
        $sort: { lastMomDate: -1 }
      }
    ]);

    res.json({
      success: true,
      data: tasksWithMoms,
      count: tasksWithMoms.length
    });
  } catch (error) {
    console.error('Error fetching tasks with MOMs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tasks with MOMs'
    });
  }
});

/**
 * GET /api/mom/view/:momId
 * Get specific MOM details
 */
router.get('/view/:momId', async (req, res) => {
  try {
    const { momId } = req.params;

    const mom = await MOM.findById(momId).populate('taskId', 'title status');

    if (!mom) {
      return res.status(404).json({
        success: false,
        error: 'MOM not found'
      });
    }

    res.json({
      success: true,
      data: mom
    });
  } catch (error) {
    console.error('Error fetching MOM details:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch MOM details'
    });
  }
});

/**
 * DELETE /api/mom/:momId
 * Delete a MOM record
 */
router.delete('/:momId', async (req, res) => {
  try {
    const { momId } = req.params;

    const mom = await MOM.findByIdAndDelete(momId);

    if (!mom) {
      return res.status(404).json({
        success: false,
        error: 'MOM not found'
      });
    }

    res.json({
      success: true,
      message: 'MOM deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting MOM:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete MOM'
    });
  }
});

/**
 * POST /api/mom/regenerate-docx-from-template/:momId
 * Regenerate Word document from saved MOM using template
 */
router.post('/regenerate-docx-from-template/:momId', async (req, res) => {
  try {
    const { momId } = req.params;
    const { templateName = 'letterhead.docx' } = req.body;

    // Fetch the saved MOM
    const mom = await MOM.findById(momId);
    if (!mom) {
      return res.status(404).json({
        success: false,
        error: 'MOM not found'
      });
    }

    console.log('📄 Regenerating DOCX from template for MOM:', momId);

    // Get task details if available
    let taskTitle = mom.title;
    if (mom.taskId) {
      try {
        const task = await Task.findById(mom.taskId);
        if (task) {
          taskTitle = task.title;
        }
      } catch (err) {
        console.log('Task not found, using saved title');
      }
    }

    // Prepare filename and path
    const filename = wordTemplatePdfService.generateFilename(
      mom.taskId || 'general',
      taskTitle
    ).replace('.pdf', '.docx');
    const outputPath = path.join(tempDir, filename);

    // Prepare data for Word template
    const momData = {
      title: mom.title,
      date: mom.visitDate,
      time: '', // Not stored in MOM model
      location: mom.location,
      attendees: mom.attendees,
      content: mom.processedContent || mom.rawContent, // Use processed content
      taskTitle,
      taskId: mom.taskId,
      companyName: mom.companyName || 'Trimity Consultants'
    };

    // Generate DOCX from Word template
    try {
      console.log('📄 Generating DOCX from Word template...');
      
      const templatePath = path.join(__dirname, '../templates', templateName);
      if (!fs.existsSync(templatePath)) {
        throw new Error('Template not found: ' + templatePath);
      }

      const Docxtemplater = require('docxtemplater');
      const PizZip = require('pizzip');
      
      // Read template
      const content = fs.readFileSync(templatePath, 'binary');
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Prepare template data
      const templateData = wordTemplatePdfService.prepareTemplateData(momData);
      doc.setData(templateData);
      doc.render();

      // Generate DOCX buffer
      const buf = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });

      // Save DOCX file
      fs.writeFileSync(outputPath, buf);
      console.log('✅ DOCX regenerated successfully from template');
    } catch (docxError) {
      console.error('❌ DOCX regeneration from template failed:', docxError.message);
      
      if (docxError.message.includes('Template not found')) {
        return res.status(404).json({
          success: false,
          error: 'Word template not found',
          message: 'Please create a Word template file named "letterhead.docx" in the backend/templates/ folder.'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to regenerate DOCX from template',
        details: docxError.message
      });
    }

    // Send DOCX as download
    res.download(outputPath, filename, (err) => {
      if (err) {
        console.error('Error sending DOCX:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Failed to download DOCX'
          });
        }
      }

      // Clean up: Delete the DOCX after sending
      setTimeout(() => {
        try {
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
            console.log('🗑️  Temporary DOCX deleted:', filename);
          }
        } catch (cleanupError) {
          console.error('Error deleting temporary DOCX:', cleanupError);
        }
      }, 5000);
    });

  } catch (error) {
    console.error('Error regenerating DOCX from template:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to regenerate DOCX from template'
    });
  }
});

/**
 * GET /api/mom/test
 * Test endpoint to verify MOM service is running
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'MOM service is running',
    features: [
      'Text processing (Gujarati/English)',
      'AI-powered text improvement',
      'Word document generation with letterhead',
      'MOM history tracking',
      'Task-MOM association'
    ]
  });
});

module.exports = router;
