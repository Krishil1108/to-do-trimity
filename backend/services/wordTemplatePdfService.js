const fs = require('fs');
const path = require('path');
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const ImageModule = require('docxtemplater-image-module-free');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class WordTemplatePDFService {
  constructor() {
    this.templatesDir = path.join(__dirname, '../templates');
    this.tempDir = path.join(__dirname, '../temp');
    this.imagesDir = path.join(__dirname, '../uploads/images'); // For storing uploaded images
    
    // Ensure directories exist
    if (!fs.existsSync(this.templatesDir)) {
      fs.mkdirSync(this.templatesDir, { recursive: true });
    }
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    if (!fs.existsSync(this.imagesDir)) {
      fs.mkdirSync(this.imagesDir, { recursive: true });
    }

    // Configure image module options
    this.imageOpts = {
      centered: false,
      getImage: (tagValue, tagName) => {
        // tagValue can be a file path, base64 string, or URL
        return this.loadImage(tagValue);
      },
      getSize: (img, tagValue, tagName) => {
        // Return default size or size based on tag name
        return this.getImageSize(tagName);
      }
    };
  }

  /**
   * Generate MOM PDF from Word template
   * @param {object} momData - MOM data with processed content
   * @param {string} outputPdfPath - Path to save the final PDF
   * @param {string} templateName - Name of the Word template to use (default: 'letterhead.docx')
   * @returns {Promise<string>} - Path to generated PDF
   */
  async generateMOMPDF(momData, outputPdfPath, templateName = 'letterhead.docx') {
    try {
      console.log('📝 Starting Word template PDF generation...');
      
      // Step 1: Load the Word template
      const templatePath = path.join(this.templatesDir, templateName);
      
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templatePath}. Please create a Word template with placeholders.`);
      }

      console.log('✅ Template found:', templatePath);

      // Step 2: Read the template file
      const content = fs.readFileSync(templatePath, 'binary');
      const zip = new PizZip(content);
      
      // Step 2.5: Attach image module
      const imageModule = new ImageModule(this.imageOpts);
      
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        modules: [imageModule]
      });

      // Step 3: Prepare data for template
      const templateData = this.prepareTemplateData(momData);
      console.log('✅ Template data prepared');
      console.log('📊 [DEBUG] discussionPoints being sent to template:', JSON.stringify(templateData.discussionPoints, null, 2));

      // Step 4: Set the template data
      doc.setData(templateData);

      try {
        // Step 5: Render the document (replace all placeholders)
        doc.render();
      } catch (error) {
        console.error('❌ Template rendering error:', error);
        throw new Error(`Template rendering failed: ${error.message}`);
      }

      // Step 6: Generate the Word document
      const buf = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });

      // Step 7: Save the Word document temporarily
      const tempDocxPath = outputPdfPath.replace('.pdf', '.docx');
      fs.writeFileSync(tempDocxPath, buf);
      console.log('✅ Word document generated:', tempDocxPath);

      // Step 8: Convert DOCX to PDF
      await this.convertDocxToPdf(tempDocxPath, outputPdfPath);
      console.log('✅ PDF generated successfully:', outputPdfPath);

      // Step 9: Clean up temporary DOCX file
      setTimeout(() => {
        try {
          if (fs.existsSync(tempDocxPath)) {
            fs.unlinkSync(tempDocxPath);
            console.log('🗑️  Temporary DOCX deleted');
          }
        } catch (err) {
          console.error('Error deleting temporary DOCX:', err);
        }
      }, 2000);

      return outputPdfPath;

    } catch (error) {
      console.error('❌ Word template PDF generation error:', error);
      throw error;
    }
  }

  /**
   * Prepare data for Word template with proper formatting
   * @param {object} momData - Raw MOM data
   * @returns {object} - Formatted data for template
   */
  prepareTemplateData(momData) {
    const {
      title = 'Minutes of Meeting',
      date = new Date().toLocaleDateString('en-IN'),
      time = '',
      location = '',
      attendees = [],
      content = '',
      taskTitle,
      taskId,
      companyName = 'Trimity Consultants',
      images = [], // New: array of image paths or base64 strings
      discussionPoints: providedDiscussionPoints // New: pre-parsed discussion points from tabular format
    } = momData;

    // Format attendees list
    const attendeesList = attendees.map(a => {
      const name = typeof a === 'string' ? a : (a.name || '');
      return { name };
    });

    // Format content with proper line breaks
    const formattedContent = this.formatContentForWord(content);

    // Split content into sections if it contains headers
    const contentSections = this.parseContentSections(content);
    
    // Use provided discussionPoints if available (from tabular format),
    // otherwise parse from content (paragraph format)
    let discussionPoints;
    if (providedDiscussionPoints && Array.isArray(providedDiscussionPoints) && providedDiscussionPoints.length > 0) {
      console.log('📊 [DEBUG] Using provided discussionPoints (tabular format):', {
        count: providedDiscussionPoints.length,
        points: providedDiscussionPoints
      });
      discussionPoints = providedDiscussionPoints;
    } else {
      console.log('📝 [DEBUG] Parsing discussionPoints from content (paragraph format)');
      discussionPoints = this.parseDiscussionPoints(content);
      console.log('📝 [DEBUG] Parsed discussion points:', {
        count: discussionPoints.length,
        points: discussionPoints
      });
    }
    
    // Also create individual point variables for simpler template usage
    const pointsObj = {};
    discussionPoints.forEach((point, index) => {
      pointsObj[`point${index + 1}Text`] = point.point;
      pointsObj[`point${index + 1}Sr`] = point.srNo;
    });
    
    // Create formatted content with PROPER line breaks for Word
    // Each point on a new line with double line break between points
    const formattedPointsText = discussionPoints
      .map(p => `${p.srNo} ${p.point}`)
      .join('\n\n');
    
    // Create an HTML table structure for Word
    const discussionTable = this.createDiscussionTable(discussionPoints);
    console.log('📊 [DEBUG] Created discussion table with', discussionPoints.length, 'rows');

    // Process images if provided
    console.log('🖼️  [DEBUG] prepareTemplateData - images parameter:', {
      provided: !!images,
      isArray: Array.isArray(images),
      count: images ? images.length : 0
    });
    
    const processedImages = this.processImages(images);
    console.log('🖼️  [DEBUG] Processed images result:', processedImages);

    const templateData = {
      // Header information
      companyName,
      documentTitle: 'MINUTES OF MEETING',
      
      // Meeting details
      meetingTitle: taskTitle || title,
      meetingDate: date,
      meetingTime: time || 'N/A',
      meetingLocation: location || 'N/A',
      
      // Attendees
      attendees: attendeesList,
      attendeesCount: attendeesList.length,
      
      // Content
      content: formattedContent,
      contentSections,
      discussionPoints,  // Array of points for table rows (for advanced templates)
      formattedPointsText, // Simple formatted text with line breaks
      discussionTable,  // HTML table for Word
      ...pointsObj,  // Individual point variables (point1Text, point1Sr, etc.)
      
      // Images
      ...processedImages,
      
      // Metadata
      generatedDate: new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      taskId: taskId || 'N/A',
      
      // Footer
      preparedBy: companyName,
      documentFooter: `This is a computer-generated document from ${companyName}`,
    };
    
    console.log('📋 [DEBUG] Final template data keys:', Object.keys(templateData));
    console.log('🖼️  [DEBUG] Image keys in template data:', Object.keys(templateData).filter(k => k.startsWith('image')));
    
    return templateData;
  }

  /**
   * Format content for Word document with proper line breaks
   * @param {string} content - Raw content
   * @returns {string} - Formatted content
   */
  formatContentForWord(content) {
    if (!content) return '';
    
    // Replace multiple newlines with double line breaks
    let formatted = content.replace(/\n\n+/g, '\n\n');
    
    // Ensure proper spacing after periods
    formatted = formatted.replace(/\.\s+/g, '. ');
    
    return formatted;
  }

  /**
   * Parse content into sections (if it contains headers)
   * @param {string} content - Raw content
   * @returns {Array} - Array of content sections
   */
  parseContentSections(content) {
    if (!content) return [];

    const sections = [];
    const lines = content.split('\n');
    let currentSection = { title: 'Discussion Points', content: [] };

    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Check if line is a header (all caps, or ends with colon, or numbered)
      if (trimmed.length > 0) {
        const isHeader = (
          trimmed === trimmed.toUpperCase() && trimmed.length < 50 ||
          trimmed.endsWith(':') ||
          /^\d+\.\s+[A-Z]/.test(trimmed)
        );

        if (isHeader) {
          // Save previous section if it has content
          if (currentSection.content.length > 0) {
            sections.push({
              title: currentSection.title,
              text: currentSection.content.join('\n')
            });
          }
          // Start new section
          currentSection = {
            title: trimmed.replace(/:$/, ''),
            content: []
          };
        } else {
          currentSection.content.push(trimmed);
        }
      }
    });

    // Add last section
    if (currentSection.content.length > 0) {
      sections.push({
        title: currentSection.title,
        text: currentSection.content.join('\n')
      });
    }

    return sections.length > 0 ? sections : [{ title: 'Discussion Points', text: content }];
  }

  /**
   * Parse discussion points into separate rows for table
   * Detects numbered points (1., 2., 3. or 1) 2) 3) etc.)
   * @param {string} content - Raw content
   * @returns {Array} - Array of discussion points with serial numbers
   */
  parseDiscussionPoints(content) {
    if (!content) return [{ srNo: '1.', point: '' }];

    const points = [];
    // Split by newlines but keep all content
    const lines = content.split('\n');
    
    let currentPoint = null;
    let pointCounter = 1;

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.length === 0) {
        return; // Skip empty lines
      }

      // Match numbered patterns at START of line: "1.", "1)", "1:", "1-"
      // More strict regex - requires number followed by punctuation and space/content
      const numberedMatch = trimmedLine.match(/^(\d+)[\.\)\:\-]\s*(.*)$/);
      
      if (numberedMatch) {
        // Save previous point if exists
        if (currentPoint) {
          points.push(currentPoint);
        }
        
        // Start new point
        const number = numberedMatch[1];
        const text = numberedMatch[2].trim();
        
        currentPoint = {
          srNo: `${number}.`,
          point: text || '' // Allow empty initial text
        };
      } else if (currentPoint) {
        // Continue previous point (multi-line point)
        if (currentPoint.point) {
          currentPoint.point += ' ' + trimmedLine;
        } else {
          currentPoint.point = trimmedLine;
        }
      } else {
        // No numbering detected, treat as single point
        if (points.length === 0) {
          currentPoint = {
            srNo: `${pointCounter}.`,
            point: trimmedLine
          };
        } else {
          // Add to last point
          if (points.length > 0) {
            points[points.length - 1].point += ' ' + trimmedLine;
          }
        }
      }
    });

    // Add last point
    if (currentPoint) {
      points.push(currentPoint);
    }

    // If no points found, return content as single point
    if (points.length === 0) {
      return [{
        srNo: '1.',
        point: content.trim()
      }];
    }

    return points;
  }

  /**
   * Create a Word XML table structure for discussion points
   * This creates actual Word table markup that can be inserted via rawXML
   * @param {Array} discussionPoints - Array of {srNo, point} objects
   * @returns {string} - Plain text table representation
   */
  createDiscussionTable(discussionPoints) {
    if (!discussionPoints || discussionPoints.length === 0) {
      return 'No discussion points available.';
    }

    // Create a simple text-based table that will display nicely in Word
    const header = '┌──────────┬────────────────────────────────────────────────────────────────────────┐\n' +
                   '│ Sr. No.  │ Point of discussion/ Observation                                      │\n' +
                   '├──────────┼────────────────────────────────────────────────────────────────────────┤';
    
    const rows = discussionPoints.map(point => {
      const srNo = point.srNo.padEnd(8);
      const text = point.point;
      return `│ ${srNo} │ ${text.padEnd(70)} │`;
    }).join('\n');
    
    const footer = '└──────────┴────────────────────────────────────────────────────────────────────────┘';

    return `${header}\n${rows}\n${footer}`;
  }

  /**
   * Convert DOCX to PDF using available methods
   * @param {string} docxPath - Path to DOCX file
   * @param {string} pdfPath - Path to save PDF
   * @returns {Promise<void>}
   */
  async convertDocxToPdf(docxPath, pdfPath) {
    console.log('🔄 Converting DOCX to PDF...');

    // Try multiple conversion methods in order of preference
    const conversionMethods = [
      () => this.convertWithLibreOffice(docxPath, pdfPath),
      () => this.convertWithPuppeteer(docxPath, pdfPath),
      () => this.copyAsDocx(docxPath, pdfPath), // Fallback: just rename to .docx if PDF conversion fails
    ];

    for (let i = 0; i < conversionMethods.length; i++) {
      try {
        await conversionMethods[i]();
        console.log(`✅ Conversion successful using method ${i + 1}`);
        return;
      } catch (error) {
        console.log(`⚠️  Conversion method ${i + 1} failed:`, error.message);
        if (i === conversionMethods.length - 1) {
          throw new Error('All PDF conversion methods failed. The document has been saved as DOCX format.');
        }
      }
    }
  }

  /**
   * Convert DOCX to PDF using LibreOffice (best quality, requires LibreOffice installed)
   * @param {string} docxPath - Path to DOCX file
   * @param {string} pdfPath - Path to save PDF
   * @returns {Promise<void>}
   */
  async convertWithLibreOffice(docxPath, pdfPath) {
    const outputDir = path.dirname(pdfPath);
    const expectedPdfName = path.basename(docxPath, '.docx') + '.pdf';
    const expectedPdfPath = path.join(outputDir, expectedPdfName);

    // Try common LibreOffice installation paths
    const libreOfficePaths = [
      'soffice', // Linux/Mac in PATH
      '"C:\\Program Files\\LibreOffice\\program\\soffice.exe"', // Windows default
      '"C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe"', // Windows 32-bit
    ];

    let lastError;
    for (const soffice of libreOfficePaths) {
      try {
        const command = `${soffice} --headless --convert-to pdf --outdir "${outputDir}" "${docxPath}"`;
        await execPromise(command);
        
        // Check if PDF was created
        if (fs.existsSync(expectedPdfPath)) {
          // Rename to desired output path if different
          if (expectedPdfPath !== pdfPath) {
            fs.renameSync(expectedPdfPath, pdfPath);
          }
          console.log('✅ LibreOffice conversion successful');
          return;
        }
      } catch (error) {
        lastError = error;
        continue;
      }
    }

    throw new Error(lastError?.message || 'LibreOffice not found or conversion failed');
  }

  /**
   * Convert DOCX to PDF using Puppeteer (requires HTML conversion first)
   * @param {string} docxPath - Path to DOCX file
   * @param {string} pdfPath - Path to save PDF
   * @returns {Promise<void>}
   */
  async convertWithPuppeteer(docxPath, pdfPath) {
    // Note: This would require mammoth.js to convert DOCX to HTML first
    // Then use Puppeteer to convert HTML to PDF
    // Implementation depends on existing puppeteer setup
    throw new Error('Puppeteer conversion not implemented for DOCX');
  }

  /**
   * Fallback: Copy DOCX with warning (when PDF conversion is not available)
   * @param {string} docxPath - Path to DOCX file
   * @param {string} pdfPath - Path to save file
   * @returns {Promise<void>}
   */
  async copyAsDocx(docxPath, pdfPath) {
    // Keep as DOCX and rename with .pdf extension so download works
    // Add a note that it's actually a DOCX file
    const docxFinalPath = pdfPath.replace('.pdf', '_DOCX_FORMAT.docx');
    fs.copyFileSync(docxPath, docxFinalPath);
    
    throw new Error(`PDF conversion unavailable. Document saved as: ${docxFinalPath}`);
  }

  /**
   * Generate filename for MOM document
   * @param {string} taskId - Task ID
   * @param {string} title - Meeting title
   * @returns {string} - Filename
   */
  generateFilename(taskId, title) {
    const sanitized = (title || 'Meeting')
      .replace(/[^a-z0-9]/gi, '_')
      .substring(0, 30);
    const timestamp = Date.now();
    return `MOM_${taskId}_${sanitized}_${timestamp}.pdf`;
  }

  /**
   * Load image from file path, base64 string, or URL
   * @param {string} tagValue - Image source (path, base64, or URL)
   * @returns {Buffer} - Image buffer
   */
  loadImage(tagValue) {
    try {
      // Check if it's a base64 string
      if (tagValue.startsWith('data:image')) {
        const base64Data = tagValue.split(',')[1];
        return Buffer.from(base64Data, 'base64');
      }
      
      // Check if it's a base64 string without prefix
      if (tagValue.match(/^[A-Za-z0-9+/=]+$/)) {
        return Buffer.from(tagValue, 'base64');
      }

      // Check if it's a file path
      let imagePath = tagValue;
      
      // If it's a relative path, resolve it
      if (!path.isAbsolute(imagePath)) {
        // Try multiple possible locations
        const possiblePaths = [
          path.join(this.imagesDir, imagePath),
          path.join(__dirname, '..', imagePath),
          path.join(process.cwd(), imagePath),
        ];
        
        for (const p of possiblePaths) {
          if (fs.existsSync(p)) {
            imagePath = p;
            break;
          }
        }
      }

      // Read the image file
      if (fs.existsSync(imagePath)) {
        return fs.readFileSync(imagePath);
      }

      // If we get here, image wasn't found
      console.warn(`Image not found: ${tagValue}`);
      return Buffer.from(''); // Return empty buffer
      
    } catch (error) {
      console.error('Error loading image:', error);
      return Buffer.from(''); // Return empty buffer on error
    }
  }

  /**
   * Get image size based on tag name or return default
   * @param {string} tagName - Name of the image placeholder
   * @returns {Array} - [width, height] in pixels
   */
  getImageSize(tagName) {
    // Define size presets based on tag names
    const sizePresets = {
      logo: [150, 50],           // Small logo
      companyLogo: [200, 80],    // Company logo
      headerImage: [600, 200],   // Header image
      signature: [150, 50],      // Signature image
      photo: [300, 300],         // Photo
      screenshot: [500, 400],    // Screenshot
      banner: [650, 150],        // Banner image
    };

    // Check if tagName matches a preset (case-insensitive)
    const lowerTagName = (tagName || '').toLowerCase();
    for (const [key, size] of Object.entries(sizePresets)) {
      if (lowerTagName.includes(key)) {
        return size;
      }
    }

    // Default size
    return [400, 300];
  }

  /**
   * Process images array into individual placeholders
   * @param {Array} images - Array of image objects or paths
   * @returns {Object} - Object with image placeholders
   */
  processImages(images) {
    const result = {};
    
    console.log('🖼️  [DEBUG] processImages called with:', {
      imagesProvided: !!images,
      isArray: Array.isArray(images),
      imageCount: images ? images.length : 0,
      imageTypes: images ? images.map(img => typeof img) : []
    });
    
    if (!images || !Array.isArray(images)) {
      console.log('⚠️  [DEBUG] No images array provided, returning empty result');
      return result;
    }

    if (images.length === 0) {
      console.log('⚠️  [DEBUG] Images array is empty');
      return result;
    }

    images.forEach((img, index) => {
      console.log(`🖼️  [DEBUG] Processing image ${index + 1}:`, {
        type: typeof img,
        isString: typeof img === 'string',
        isObject: typeof img === 'object',
        hasData: img && img.data ? 'yes' : 'no',
        dataLength: img && img.data ? img.data.length : 0,
        preview: typeof img === 'string' ? img.substring(0, 50) + '...' : 'object'
      });
      
      if (typeof img === 'string') {
        // If it's just a path/base64, use default naming
        result[`image${index + 1}`] = img;
        console.log(`✅ [DEBUG] Added image${index + 1} to template data`);
      } else if (typeof img === 'object' && img.name && img.data) {
        // If it's an object with name and data
        result[img.name] = img.data;
        console.log(`✅ [DEBUG] Added ${img.name} to template data`);
      } else {
        console.warn(`⚠️  [DEBUG] Skipping invalid image at index ${index}:`, img);
      }
    });

    console.log('🖼️  [DEBUG] Final processed images:', Object.keys(result));
    return result;
  }
}

module.exports = new WordTemplatePDFService();
