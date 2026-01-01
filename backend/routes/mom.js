const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Task = require('../models/Task');
const textProcessingService = require('../services/textProcessingService');
const pdfGenerationService = require('../services/pdfGenerationService');

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
    
    const filename = pdfGenerationService.generateFilename(
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

    await pdfGenerationService.generateMOMPDF(momData, outputPath);

    // Step 4: Send PDF as download
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
    const filename = pdfGenerationService.generateFilename(
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

    await pdfGenerationService.generateMOMPDF(momData, outputPath);

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
      'Automatic cleanup (no database storage)'
    ]
  });
});

module.exports = router;
