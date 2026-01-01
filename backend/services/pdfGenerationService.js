const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerationService {
  /**
   * Generate a professional letterhead PDF with MOM content matching Samruddh Vatika format
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
            top: 50,
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
   * Add professional letterhead matching Samruddh Vatika format
   * @param {PDFDocument} doc - PDF document
   * @param {string} companyName - Company name
   */
  addLetterhead(doc, companyName = 'Trido Task Management') {
    const pageWidth = doc.page.width;
    
    // Top colored bar (blue professional header)
    doc.rect(0, 0, pageWidth, 90)
       .fill('#2563eb');

    // Company name (centered and bold)
    doc.fontSize(28)
       .fillColor('#ffffff')
       .font('Helvetica-Bold')
       .text(companyName, 0, 20, {
         width: pageWidth,
         align: 'center'
       });

    // Tagline
    doc.fontSize(11)
       .fillColor('#e0e7ff')
       .font('Helvetica')
       .text('Professional Task & Project Management', 0, 55, {
         width: pageWidth,
         align: 'center'
       });

    // Reset to body position
    doc.y = 100;
  }

  /**
   * Add MOM content in Samruddh Vatika format
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

    let yPos = doc.y;

    // Document Title (centered and underlined)
    doc.fontSize(16)
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text(title, 50, yPos, {
         width: 495,
         align: 'center',
         underline: true
       });

    yPos += 40;

    // Meeting Details Section
    doc.fontSize(10)
       .fillColor('#000000')
       .font('Helvetica');

    // Date
    if (date) {
      doc.font('Helvetica-Bold').text('Date: ', 50, yPos, { continued: true })
         .font('Helvetica').text(date);
      yPos += 20;
    }

    // Time
    if (time) {
      doc.font('Helvetica-Bold').text('Time: ', 50, yPos, { continued: true })
         .font('Helvetica').text(time);
      yPos += 20;
    }

    // Location/Venue
    if (location) {
      doc.font('Helvetica-Bold').text('Venue: ', 50, yPos, { continued: true })
         .font('Helvetica').text(location);
      yPos += 20;
    }

    // Related Task (if applicable)
    if (taskTitle) {
      doc.font('Helvetica-Bold').text('Related Task: ', 50, yPos, { continued: true })
         .font('Helvetica').text(taskTitle);
      yPos += 20;
    }

    if (taskId) {
      doc.font('Helvetica-Bold').text('Task ID: ', 50, yPos, { continued: true })
         .font('Helvetica').text(taskId);
      yPos += 20;
    }

    yPos += 10;

    // Attendees Section
    if (attendees && attendees.length > 0) {
      doc.font('Helvetica-Bold')
         .fontSize(11)
         .text('Attendees:', 50, yPos);
      
      yPos += 18;
      doc.fontSize(10)
         .font('Helvetica');

      attendees.forEach((attendee, index) => {
        const attendeeName = typeof attendee === 'string' ? attendee : attendee.name || 'Unknown';
        doc.text(`${index + 1}. ${attendeeName}`, 60, yPos);
        yPos += 15;
      });

      yPos += 10;
    }

    // Horizontal separator line
    doc.strokeColor('#cccccc')
       .lineWidth(0.5)
       .moveTo(50, yPos)
       .lineTo(545, yPos)
       .stroke();

    yPos += 20;

    // Meeting Notes Header
    doc.font('Helvetica-Bold')
       .fontSize(12)
       .fillColor('#000000')
       .text('Meeting Notes:', 50, yPos);

    yPos += 25;

    // Meeting Notes Content
    if (content) {
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text(content, 50, yPos, {
           width: 495,
           align: 'justify',
           lineGap: 5
         });
    }

    // Add signature area at the end
    this.addSignatureArea(doc);
  }

  /**
   * Add signature area to PDF
   * @param {PDFDocument} doc - PDF document
   */
  addSignatureArea(doc) {
    // Add some space before signatures
    doc.moveDown(2);

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
   * Add footer matching professional format
   * @param {PDFDocument} doc - PDF document
   */
  addFooter(doc) {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      const footerY = doc.page.height - 40;
      
      // Footer separator line
      doc.strokeColor('#2563eb')
         .lineWidth(1)
         .moveTo(50, footerY)
         .lineTo(doc.page.width - 50, footerY)
         .stroke();

      // Footer text - left aligned
      doc.fontSize(7)
         .fillColor('#666666')
         .font('Helvetica')
         .text(
           `Generated: ${new Date().toLocaleDateString('en-IN', { 
             day: '2-digit',
             month: '2-digit',
             year: 'numeric'
           })} ${new Date().toLocaleTimeString('en-IN', {
             hour: '2-digit',
             minute: '2-digit'
           })}`,
           50,
           footerY + 8
         );

      // Page number - right aligned
      doc.fontSize(7)
         .text(
           `Page ${i + 1} of ${pageCount}`,
           doc.page.width - 150,
           footerY + 8,
           {
             width: 100,
             align: 'right'
           }
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
