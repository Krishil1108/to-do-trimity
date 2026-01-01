const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerationService {
  /**
   * Generate Trimity Consultants professional MOM PDF with table format
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
            top: 30,
            bottom: 30,
            left: 30,
            right: 30
          }
        });

        // Pipe the PDF to a file
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Add Trimity Consultants letterhead
        this.addTrimityLetterhead(doc);

        // Add project and participant details
        this.addProjectDetails(doc, momData);

        // Add MOM table
        this.addMOMTable(doc, momData);

        // Add footer with signatures
        this.addTrimityFooter(doc);

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
   * Add Trimity Consultants letterhead with company details
   * @param {PDFDocument} doc - PDF document
   */
  addTrimityLetterhead(doc) {
    const pageWidth = doc.page.width;
    
    // Draw outer border
    doc.rect(30, 30, pageWidth - 60, doc.page.height - 60)
       .stroke('#000000');

    // Company Logo Area (Blue background strip at top)
    doc.rect(40, 40, pageWidth - 80, 60)
       .fill('#FF8C00'); // Orange color like Trimity

    // Company Name
    doc.fontSize(20)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .text('TR', 60, 55, { continued: true })
       .fillColor('#000000')
       .text('i', { continued: true })
       .fillColor('#FFFFFF')
       .text('M', { continued: true })
       .fillColor('#000000')
       .text('i', { continued: true })
       .fillColor('#FFFFFF')
       .text('TY', { continued: false });

    doc.fontSize(10)
       .fillColor('#FFFFFF')
       .font('Helvetica')
       .text('CONSULTANTS', 60, 80);

    // Company Address and Contact Details (right side)
    doc.fontSize(7)
       .fillColor('#000000')
       .font('Helvetica')
       .text('1402-B, Yash Anant, Ashram road,', pageWidth - 250, 45, { width: 200, align: 'left' })
       .text('Opposite old Reserve bank of India,', pageWidth - 250, 56)
       .text('Navrangpura, Ahmedabad, Gujarat 380009', pageWidth - 250, 67);

    // Horizontal line after header
    doc.moveTo(40, 105).lineTo(pageWidth - 40, 105).stroke('#FF8C00');

    // Contact details below
    doc.fontSize(7)
       .fillColor('#000000')
       .text('E mail: trimityconsultants@gmail.com', 60, 110)
       .text('Website: www.trimity.co.in', 220, 110)
       .text('Mobile No: +91 9662474538, +91 8128228872', 360, 110);

    doc.y = 130;
  }

  /**
   * Add project details and participant information
   * @param {PDFDocument} doc - PDF document
   * @param {object} momData - MOM data
   */
  addProjectDetails(doc, momData) {
    const pageWidth = doc.page.width;
    let yPos = doc.y;

    // Project name and Date on same line
    doc.fontSize(9)
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text(`Project name :- ${momData.title || 'N/A'}`, 50, yPos, { continued: false });

    doc.text(`Date of visit :- ${momData.date || 'N/A'}`, pageWidth - 250, yPos, { width: 200 });

    yPos += 20;

    // Participant names
    doc.text('Participant name :- ', 50, yPos, { continued: false });
    
    yPos += 12;
    
    const attendees = momData.attendees || [];
    attendees.forEach((attendee, index) => {
      const name = typeof attendee === 'string' ? attendee : attendee.name || 'Unknown';
      doc.font('Helvetica').text(`:- ${name}`, 120, yPos);
      yPos += 12;
    });

    // Add site visit type
    doc.font('Helvetica-Bold').text('Site visit :- ', 50, yPos - 12, { continued: true });
    doc.font('Helvetica').text(momData.location || 'Routine / Special', { underline: true });

    yPos += 10;
    doc.y = yPos;
  }

  /**
   * Add Minutes of Meeting table
   * @param {PDFDocument} doc - PDF document
   * @param {object} momData - MOM data
   */
  addMOMTable(doc, momData) {
    const pageWidth = doc.page.width;
    let yPos = doc.y + 10;

    // Table title
    doc.fontSize(11)
       .fillColor('#000000')
       .font('Helvetica-Bold')
       .text('Minutes of Meeting (MoM)', 50, yPos, { width: pageWidth - 100, align: 'center', underline: true });

    yPos += 25;

    // Table header
    const tableLeft = 50;
    const tableRight = pageWidth - 50;
    const tableWidth = tableRight - tableLeft;
    const col1Width = 50; // Sr. No. column
    const col2Width = tableWidth - col1Width; // Points column

    // Draw table header
    doc.rect(tableLeft, yPos, tableWidth, 30).stroke();
    doc.moveTo(tableLeft + col1Width, yPos).lineTo(tableLeft + col1Width, yPos + 30).stroke();

    // Header text
    doc.fontSize(9)
       .font('Helvetica-Bold')
       .text('Sr.', tableLeft + 5, yPos + 5, { width: col1Width - 10, align: 'center' })
       .text('No.', tableLeft + 5, yPos + 15, { width: col1Width - 10, align: 'center' });

    doc.text('Point of discussion/ Observation', tableLeft + col1Width + 10, yPos + 10, { 
      width: col2Width - 20, 
      align: 'center' 
    });

    yPos += 30;

    // Parse content into points
    const content = momData.content || '';
    const points = this.parseContentIntoPoints(content);

    // Add table rows
    const rowHeight = 30;
    const maxRows = 15; // Maximum rows that fit on page
    
    for (let i = 0; i < maxRows; i++) {
      // Draw row
      doc.rect(tableLeft, yPos, tableWidth, rowHeight).stroke();
      doc.moveTo(tableLeft + col1Width, yPos).lineTo(tableLeft + col1Width, yPos + rowHeight).stroke();

      // Add content if available
      if (i < points.length) {
        doc.fontSize(8)
           .font('Helvetica-Bold')
           .text(`${i + 1}.`, tableLeft + 5, yPos + 10, { width: col1Width - 10, align: 'center' });

        doc.font('Helvetica')
           .text(points[i], tableLeft + col1Width + 5, yPos + 5, { 
             width: col2Width - 10, 
             align: 'left',
             lineGap: 2
           });
      }

      yPos += rowHeight;

      // Check if we need a new page
      if (yPos > doc.page.height - 120) {
        break;
      }
    }

    doc.y = yPos;
  }

  /**
   * Parse content into bullet points/observations
   * @param {string} content - Meeting content
   * @returns {string[]} - Array of points
   */
  parseContentIntoPoints(content) {
    if (!content) return [];

    // Split by periods, newlines, or bullet points
    let points = content
      .split(/[.\n]/)
      .map(p => p.trim())
      .filter(p => p.length > 10 && p.length < 200);

    // If no good splits, return full content as one point
    if (points.length === 0) {
      points = [content.substring(0, 400)];
    }

    return points.slice(0, 15); // Max 15 points
  }

  /**
   * Add Trimity footer with signatures
   * @param {PDFDocument} doc - PDF document
   */
  addTrimityFooter(doc) {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 70;

    // Signature lines
    doc.fontSize(8)
       .font('Helvetica')
       .text('Trimity Consultant engineer name and sign', 50, footerY)
       .text('Concern person sign', pageWidth - 180, footerY);

    doc.fontSize(9)
       .font('Helvetica-Bold')
       .text('Vraj Patel', 50, footerY + 12)
       .text('Client Name', pageWidth - 180, footerY + 12);

    // Decorative barcode-like footer
    const barcodeY = pageHeight - 45;
    for (let i = 0; i < 100; i++) {
      const x = 50 + (i * 5);
      const height = Math.random() > 0.5 ? 8 : 4;
      doc.rect(x, barcodeY, 2, height).fill('#000000');
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
