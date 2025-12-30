const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerationService {
  /**
   * Generate a professional letterhead PDF with MOM content
   * @param {object} momData - MOM data
   * @param {string} outputPath - Path to save the PDF
   * @returns {Promise<string>} - Path to generated PDF
   */
  async generateMOMPDF(momData, outputPath) {
    return new Promise((resolve, reject) => {
      try {
        // Create a new PDF document
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 100,
            bottom: 50,
            left: 50,
            right: 50
          }
        });

        // Pipe the PDF to a file
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Add letterhead header
        this.addLetterhead(doc, momData.companyName || 'Trido Task Management');

        // Add MOM content
        this.addMOMContent(doc, momData);

        // Add footer
        this.addFooter(doc);

        // Finalize the PDF
        doc.end();

        stream.on('finish', () => {
          console.log('✅ PDF generated successfully:', outputPath);
          resolve(outputPath);
        });

        stream.on('error', (error) => {
          console.error('❌ PDF generation error:', error);
          reject(error);
        });

      } catch (error) {
        console.error('❌ Error creating PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Add professional letterhead to PDF
   * @param {PDFDocument} doc - PDF document
   * @param {string} companyName - Company name
   */
  addLetterhead(doc, companyName = 'Trido Task Management') {
    const pageWidth = doc.page.width;
    
    // Header background
    doc.rect(0, 0, pageWidth, 80)
       .fill('#2563eb'); // Professional blue color

    // Company name
    doc.fontSize(24)
       .fillColor('#ffffff')
       .font('Helvetica-Bold')
       .text(companyName, 50, 25, {
         width: pageWidth - 100,
         align: 'center'
       });

    // Tagline or subtitle
    doc.fontSize(10)
       .fillColor('#e0e7ff')
       .font('Helvetica')
       .text('Professional Task & Project Management', 50, 55, {
         width: pageWidth - 100,
         align: 'center'
       });

    // Reset position
    doc.moveDown(2);
  }

  /**
   * Add MOM content to PDF
   * @param {PDFDocument} doc - PDF document
   * @param {object} momData - MOM data
   */
  addMOMContent(doc, momData) {
    const {
      title = 'Minutes of Meeting',
      date,
      time,
      location,
      attendees = [],
      content,
      taskTitle,
      taskId
    } = momData;

    // Title
    doc.fontSize(18)
       .fillColor('#1e293b')
       .font('Helvetica-Bold')
       .text(title, {
         align: 'center',
         underline: true
       });

    doc.moveDown(1.5);

    // Meeting details in a box
    doc.fontSize(10)
       .fillColor('#475569')
       .font('Helvetica');

    // Date and Time
    if (date) {
      doc.font('Helvetica-Bold').text('Date: ', { continued: true })
         .font('Helvetica').text(date);
    }

    if (time) {
      doc.font('Helvetica-Bold').text('Time: ', { continued: true })
         .font('Helvetica').text(time);
    }

    if (location) {
      doc.font('Helvetica-Bold').text('Location: ', { continued: true })
         .font('Helvetica').text(location);
    }

    // Related Task
    if (taskTitle) {
      doc.font('Helvetica-Bold').text('Related Task: ', { continued: true })
         .font('Helvetica').text(taskTitle);
    }

    if (taskId) {
      doc.font('Helvetica-Bold').text('Task ID: ', { continued: true })
         .font('Helvetica').text(taskId);
    }

    doc.moveDown(1);

    // Attendees
    if (attendees && attendees.length > 0) {
      doc.font('Helvetica-Bold')
         .fontSize(12)
         .fillColor('#1e293b')
         .text('Attendees:');
      
      doc.moveDown(0.5);
      doc.fontSize(10)
         .fillColor('#475569')
         .font('Helvetica');

      attendees.forEach(attendee => {
        doc.text(`• ${attendee}`, { indent: 20 });
      });

      doc.moveDown(1);
    }

    // Horizontal line
    doc.strokeColor('#e2e8f0')
       .lineWidth(1)
       .moveTo(50, doc.y)
       .lineTo(doc.page.width - 50, doc.y)
       .stroke();

    doc.moveDown(1);

    // Main content
    doc.font('Helvetica-Bold')
       .fontSize(12)
       .fillColor('#1e293b')
       .text('Meeting Notes:');

    doc.moveDown(0.5);

    // Content with proper formatting
    doc.fontSize(10)
       .fillColor('#334155')
       .font('Helvetica')
       .text(content, {
         align: 'justify',
         lineGap: 4
       });

    doc.moveDown(2);

    // Signature area
    this.addSignatureArea(doc);
  }

  /**
   * Add signature area to PDF
   * @param {PDFDocument} doc - PDF document
   */
  addSignatureArea(doc) {
    const yPos = doc.page.height - 150;
    
    // Check if we need a new page
    if (doc.y > yPos - 50) {
      doc.addPage();
    } else {
      doc.y = yPos;
    }

    doc.fontSize(9)
       .fillColor('#64748b')
       .font('Helvetica-Oblique')
       .text('This is a system-generated document.', {
         align: 'center'
       });

    doc.moveDown(1);

    const col1X = 80;
    const col2X = doc.page.width - 200;

    // Prepared by
    doc.fontSize(10)
       .fillColor('#1e293b')
       .font('Helvetica');
    
    doc.text('_____________________', col1X, doc.y);
    doc.text('Prepared By', col1X, doc.y + 5);

    // Approved by
    doc.text('_____________________', col2X, doc.y - 15);
    doc.text('Approved By', col2X, doc.y + 5);
  }

  /**
   * Add footer to PDF
   * @param {PDFDocument} doc - PDF document
   */
  addFooter(doc) {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      // Footer line
      doc.strokeColor('#e2e8f0')
         .lineWidth(0.5)
         .moveTo(50, doc.page.height - 40)
         .lineTo(doc.page.width - 50, doc.page.height - 40)
         .stroke();

      // Footer text
      doc.fontSize(8)
         .fillColor('#94a3b8')
         .font('Helvetica')
         .text(
           `Generated on ${new Date().toLocaleDateString('en-US', { 
             year: 'numeric', 
             month: 'long', 
             day: 'numeric',
             hour: '2-digit',
             minute: '2-digit'
           })}`,
           50,
           doc.page.height - 30,
           {
             align: 'left'
           }
         );

      // Page number
      doc.text(
        `Page ${i + 1} of ${pageCount}`,
        50,
        doc.page.height - 30,
        {
          align: 'right'
        }
      );
    }
  }

  /**
   * Generate filename for MOM PDF
   * @param {string} taskId - Task ID
   * @param {string} taskTitle - Task title
   * @returns {string} - Filename
   */
  generateFilename(taskId, taskTitle) {
    const timestamp = Date.now();
    const sanitizedTitle = taskTitle
      ? taskTitle.replace(/[^a-z0-9]/gi, '_').substring(0, 50)
      : 'meeting';
    
    return `MOM_${sanitizedTitle}_${taskId}_${timestamp}.pdf`;
  }
}

module.exports = new PDFGenerationService();
