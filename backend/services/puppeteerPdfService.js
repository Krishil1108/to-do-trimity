const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

class PuppeteerPDFService {
  /**
   * Generate MOM PDF using Puppeteer with letterhead template
   * @param {object} momData - MOM data
   * @param {string} outputPath - Output file path
   * @returns {Promise<string>} - Path to generated PDF
   */
  async generateMOMPDF(momData, outputPath) {
    let browser;
    try {
      console.log('🚀 Starting Puppeteer PDF generation...');

      // Launch browser with Render.com compatible configuration
      const browserConfig = {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080'
        ]
      };

      // Use Puppeteer's bundled Chromium or system Chrome if available
      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        browserConfig.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      }

      browser = await puppeteer.launch(browserConfig);

      const page = await browser.newPage();

      // Generate HTML content
      const htmlContent = this.generateHTML(momData);

      // Set content
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0'
      });

      // Generate PDF with precise settings
      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        }
      });

      console.log('✅ PDF generated successfully:', outputPath);
      return outputPath;

    } catch (error) {
      console.error('❌ Puppeteer PDF generation error:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Generate HTML with letterhead background and positioned content
   * @param {object} momData - MOM data
   * @returns {string} - HTML content
   */
  generateHTML(momData) {
    const {
      title = 'Project Name',
      date = new Date().toLocaleDateString('en-IN'),
      location = 'Routine',
      attendees = [],
      content = '',
      taskTitle,
      taskId
    } = momData;

    // Parse content into discussion points
    const discussionPoints = this.parseContentIntoPoints(content);

    // Generate attendee HTML
    const attendeesHTML = attendees.map((attendee, index) => {
      const name = typeof attendee === 'string' ? attendee : attendee.name || 'Unknown';
      return `<div style="position: absolute; left: 120mm; top: ${42 + (index * 5)}mm; font-size: 9pt;">:- ${name}</div>`;
    }).join('');

    // Generate table rows HTML
    const rowsHTML = this.generateTableRows(discussionPoints);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: A4;
      margin: 0;
    }

    body {
      width: 210mm;
      height: 297mm;
      font-family: Arial, Helvetica, sans-serif;
      position: relative;
      background-color: white;
    }

    /* Letterhead background */
    .letterhead-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 210mm;
      height: 297mm;
      z-index: 1;
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="794" height="1123"><rect width="794" height="1123" fill="white"/><rect x="0" y="0" width="794" height="80" fill="%23FF8C00"/><text x="60" y="45" font-family="Arial" font-size="24" font-weight="bold" fill="white">TRiMiTY</text><text x="60" y="65" font-family="Arial" font-size="12" fill="white">CONSULTANTS</text><text x="540" y="25" font-family="Arial" font-size="9" fill="black">1402-B, Yash Anant, Ashram road,</text><text x="540" y="37" font-family="Arial" font-size="9" fill="black">Opposite old Reserve bank of India,</text><text x="540" y="49" font-family="Arial" font-size="9" fill="black">Navrangpura, Ahmedabad, Gujarat 380009</text><line x1="40" y1="85" x2="754" y2="85" stroke="%23FF8C00" stroke-width="2"/><text x="60" y="100" font-family="Arial" font-size="8" fill="black">E mail: trimityconsultants@gmail.com</text><text x="280" y="100" font-family="Arial" font-size="8" fill="black">Website: www.trimity.co.in</text><text x="480" y="100" font-family="Arial" font-size="8" fill="black">Mobile No: +91 9662474538</text><rect x="30" y="30" width="734" height="1063" fill="none" stroke="black" stroke-width="2"/></svg>');
      background-size: 210mm 297mm;
      background-repeat: no-repeat;
      background-position: center;
    }

    /* Content layer */
    .content {
      position: absolute;
      top: 0;
      left: 0;
      width: 210mm;
      height: 297mm;
      z-index: 2;
    }

    /* Positioned text fields */
    .project-name {
      position: absolute;
      left: 15mm;
      top: 38mm;
      font-size: 9pt;
      font-weight: bold;
    }

    .date-visit {
      position: absolute;
      left: 140mm;
      top: 38mm;
      font-size: 9pt;
      font-weight: bold;
    }

    .participant-label {
      position: absolute;
      left: 15mm;
      top: 45mm;
      font-size: 9pt;
      font-weight: bold;
    }

    .site-visit {
      position: absolute;
      left: 15mm;
      top: 58mm;
      font-size: 9pt;
      font-weight: bold;
    }

    .site-visit-value {
      text-decoration: underline;
    }

    /* Table title */
    .table-title {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      top: 68mm;
      font-size: 11pt;
      font-weight: bold;
      text-decoration: underline;
    }

    /* Table rows container */
    .table-rows {
      position: absolute;
      left: 15mm;
      top: 78mm;
      width: 180mm;
    }

    .table-row {
      display: flex;
      border: 1px solid #000;
      min-height: 12mm;
      page-break-inside: avoid;
    }

    .row-number {
      width: 15mm;
      border-right: 1px solid #000;
      padding: 2mm;
      text-align: center;
      font-size: 8pt;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .row-content {
      flex: 1;
      padding: 2mm;
      font-size: 8pt;
      line-height: 1.4;
      display: flex;
      align-items: center;
    }

    /* Footer signatures */
    .footer-signatures {
      position: absolute;
      bottom: 25mm;
      left: 15mm;
      right: 15mm;
      display: flex;
      justify-content: space-between;
    }

    .signature-left {
      font-size: 8pt;
    }

    .signature-right {
      font-size: 8pt;
      text-align: right;
    }

    .signature-name {
      font-weight: bold;
      font-size: 9pt;
      margin-top: 2mm;
    }
  </style>
</head>
<body>
  <!-- Letterhead Background -->
  <div class="letterhead-bg"></div>

  <!-- Content Layer -->
  <div class="content">
    <!-- Project Name -->
    <div class="project-name">Project name :- ${this.escapeHtml(taskTitle || title)}</div>

    <!-- Date of Visit -->
    <div class="date-visit">Date of visit :- ${date}</div>

    <!-- Participant Names -->
    <div class="participant-label">Participant name :-</div>
    ${attendeesHTML}

    <!-- Site Visit Type -->
    <div class="site-visit">Site visit :- <span class="site-visit-value">${location}</span></div>

    <!-- Table Title -->
    <div class="table-title">Minutes of Meeting (MoM)</div>

    <!-- Table Rows -->
    <div class="table-rows">
      ${rowsHTML}
    </div>

    <!-- Footer Signatures -->
    <div class="footer-signatures">
      <div class="signature-left">
        <div>Trimity Consultant engineer name and sign</div>
        <div class="signature-name">Vraj Patel</div>
      </div>
      <div class="signature-right">
        <div>Concern person sign</div>
        <div class="signature-name">Client Name</div>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate table rows HTML
   * @param {string[]} points - Discussion points
   * @returns {string} - HTML for rows
   */
  generateTableRows(points) {
    const rows = [];
    const maxRows = 15;

    for (let i = 0; i < maxRows; i++) {
      const point = points[i] || '';
      rows.push(`
        <div class="table-row">
          <div class="row-number">${i + 1}.</div>
          <div class="row-content">${this.escapeHtml(point)}</div>
        </div>
      `);
    }

    return rows.join('');
  }

  /**
   * Parse content into discussion points
   * @param {string} content - Content text
   * @returns {string[]} - Array of points
   */
  parseContentIntoPoints(content) {
    if (!content || typeof content !== 'string') return [];

    // Split by sentences or newlines
    let points = content
      .split(/[.\n]/)
      .map(p => p.trim())
      .filter(p => p.length > 15 && p.length < 250);

    // If no good splits, return as single point
    if (points.length === 0 && content.length > 0) {
      points = [content.substring(0, 400)];
    }

    return points.slice(0, 15);
  }

  /**
   * Escape HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
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

module.exports = new PuppeteerPDFService();
