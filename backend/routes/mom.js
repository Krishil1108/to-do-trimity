const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Task = require('../models/Task');
const MOM = require('../models/MOM');
const textProcessingService = require('../services/textProcessingService');
const puppeteerPdfService = require('../services/puppeteerPdfService');

// Create temp directory for PDFs if it doesn't exist
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
 * Save MOM to history without generating PDF
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
      pdfFilename: `MOM_${taskId}_${Date.now()}.pdf`,
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
 * POST /api/mom/generate-pdf
 * Generate MOM PDF and download
 */
router.post('/generate-pdf', async (req, res) => {
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

    // Step 1: Get task details if taskId provided
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

    // Step 2: Process the text (translate and improve)
    console.log('📝 Processing MOM content...');
    const processedResult = await textProcessingService.processMOMText(rawContent);
    
    if (!processedResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to process MOM content'
      });
    }

    // Step 3: Generate PDF
    console.log('📄 Generating PDF...');
    console.log('🔍 [DEBUG] Processed text:', processedResult.processedText?.substring(0, 100));
    
    const filename = puppeteerPdfService.generateFilename(
      taskId || 'general',
      taskTitle || title
    );
    const outputPath = path.join(tempDir, filename);

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
      companyName: companyName || 'Trido Task Management'
    };

    // Step 4: Save MOM to database BEFORE generating PDF (so it's saved even if PDF fails)
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
        pdfFilename: filename,
        companyName: companyName || 'Trimity Consultants'
      });
      
      const savedMom = await momRecord.save();
      momRecordId = savedMom._id;
      console.log('✅ MOM saved to database:', momRecordId);
    } catch (dbError) {
      console.error('⚠️  Failed to save MOM to database:', dbError);
      // Continue to try generating PDF even if DB save fails
    }

    // Step 5: Generate PDF
    try {
      await puppeteerPdfService.generateMOMPDF(momData, outputPath);
      console.log('✅ PDF generated successfully');
    } catch (pdfError) {
      console.error('❌ PDF generation failed:', pdfError.message);
      // Return saved MOM info even if PDF failed
      return res.status(500).json({
        success: false,
        error: 'PDF generation failed but MOM was saved',
        momId: momRecordId,
        message: 'Your MOM has been saved in history. You can regenerate the PDF from MOM History page.'
      });
    }

    // Step 6: Send PDF as download
    res.download(outputPath, filename, (err) => {
      if (err) {
        console.error('Error sending PDF:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Failed to download PDF'
          });
        }
      }

      // Clean up: Delete the PDF after sending
      setTimeout(() => {
        try {
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
            console.log('🗑️  Temporary PDF deleted:', filename);
          }
        } catch (cleanupError) {
          console.error('Error deleting temporary PDF:', cleanupError);
        }
      }, 5000); // Delete after 5 seconds
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate PDF'
    });
  }
});

/**
 * POST /api/mom/generate-complete
 * Complete MOM generation (process text + generate PDF in one call)
 */
router.post('/generate-complete', async (req, res) => {
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

    // Process the text
    console.log('📝 Processing MOM content...');
    const processedResult = await textProcessingService.processMOMText(rawContent);

    // Generate PDF
    console.log('📄 Generating PDF...');
    const filename = puppeteerPdfService.generateFilename(
      taskId || 'general',
      taskTitle || title
    );
    const outputPath = path.join(tempDir, filename);

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
      companyName: companyName || 'Trido Task Management'
    };

    await puppeteerPdfService.generateMOMPDF(momData, outputPath);

    // Send PDF as download
    res.download(outputPath, filename, (err) => {
      if (err && !res.headersSent) {
        console.error('Error sending PDF:', err);
        res.status(500).json({
          success: false,
          error: 'Failed to download PDF'
        });
      }

      // Clean up
      setTimeout(() => {
        try {
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
            console.log('🗑️  Temporary PDF deleted:', filename);
          }
        } catch (cleanupError) {
          console.error('Error deleting temporary PDF:', cleanupError);
        }
      }, 5000);
    });

  } catch (error) {
    console.error('Error in complete MOM generation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate MOM'
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
 * POST /api/mom/regenerate-pdf/:momId
 * Regenerate PDF for an existing MOM
 */
router.post('/regenerate-pdf/:momId', async (req, res) => {
  try {
    const { momId } = req.params;

    const mom = await MOM.findById(momId).populate('taskId', 'title');

    if (!mom) {
      return res.status(404).json({
        success: false,
        error: 'MOM not found'
      });
    }

    // Generate PDF
    const filename = puppeteerPdfService.generateFilename(
      mom.taskId?._id || 'general',
      mom.taskId?.title || mom.title
    );
    const outputPath = path.join(tempDir, filename);

    const momData = {
      title: mom.title,
      date: mom.visitDate,
      location: mom.location,
      attendees: mom.attendees,
      content: mom.processedContent,
      taskTitle: mom.taskId?.title || mom.title,
      taskId: mom.taskId?._id,
      companyName: mom.companyName
    };

    await puppeteerPdfService.generateMOMPDF(momData, outputPath);

    // Send PDF
    res.download(outputPath, filename, (err) => {
      if (err && !res.headersSent) {
        console.error('Error sending PDF:', err);
        res.status(500).json({
          success: false,
          error: 'Failed to download PDF'
        });
      }

      // Clean up
      setTimeout(() => {
        try {
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
          }
        } catch (cleanupError) {
          console.error('Error deleting temporary PDF:', cleanupError);
        }
      }, 5000);
    });

  } catch (error) {
    console.error('Error regenerating PDF:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to regenerate PDF'
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
 * GET /api/mom/test
 * Test endpoint to verify MOM service is working
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'MOM service is running',
    features: [
      'Text processing (Gujarati/English)',
      'AI-powered text improvement',
      'PDF generation with letterhead',
      'MOM history tracking',
      'Task-MOM association'
    ]
  });
});

module.exports = router;
