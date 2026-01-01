const puppeteerCore = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
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

      // Launch browser with serverless-optimized Chromium for production
      // Falls back to local Puppeteer for development
      let browser;
      
      if (process.env.NODE_ENV === 'production') {
        // Use @sparticuz/chromium for Render.com
        browser = await puppeteerCore.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
        });
      } else {
        // Use regular puppeteer for local development
        const puppeteer = require('puppeteer');
        browser = await puppeteer.launch({
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
      }

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

    // Generate attendee list
    const attendeesList = attendees.map((a, i) => {
      const name = typeof a === 'string' ? a : a.name || 'Unknown';
      return `${i+1}. ${this.escapeHtml(name)}`;
    }).join('<br>');

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
      font-family: Arial, sans-serif;
      background-color: white;
      padding: 5mm;
    }

    .page-border {
      border: 3px solid #000;
      padding: 3mm;
      height: 100%;
    }

    /* Header */
    .header {
      background: #FF8C00;
      padding: 8px 12px;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 3mm;
    }

    .company-info {
      flex: 1;
    }

    .company-name {
      font-size: 18pt;
      font-weight: bold;
      letter-spacing: 3px;
      line-height: 1;
    }

    .company-subtitle {
      font-size: 9pt;
      letter-spacing: 2px;
      margin-top: 2px;
    }

    .address-box {
      background: white;
      color: black;
      padding: 6px 10px;
      font-size: 7.5pt;
      line-height: 1.3;
      max-width: 280px;
    }

    .contact-info {
      background: white;
      color: black;
      padding: 4px 10px;
      margin-top: 2mm;
      font-size: 7pt;
      text-align: center;
    }

    /* Info Section */
    .info-section {
      background: #FFF8E1;
      border: 2px solid #000;
      padding: 8px 12px;
      margin: 3mm 0;
      font-size: 9.5pt;
    }

    .info-row {
      margin: 5px 0;
      display: flex;
      align-items: flex-start;
    }

    .info-row.top-row {
      justify-content: space-between;
      align-items: center;
    }

    .info-label {
      font-weight: bold;
      display: inline-block;
      min-width: 140px;
    }

    .info-value {
      display: inline;
    }

    .participant-list {
      display: inline-block;
      line-height: 1.5;
    }

    .underline {
      text-decoration: underline;
    }

    /* Title */
    .mom-title {
      text-align: center;
      font-size: 13pt;
      font-weight: bold;
      text-decoration: underline;
      margin: 8mm 0 3mm 0;
    }

    /* Table */
    .mom-table {
      width: 100%;
      border-collapse: collapse;
      border: 2px solid #000;
      margin-bottom: 10px;
    }

    .mom-table td {
      border: 1px solid #000;
      padding: 6px 8px;
      font-size: 8.5pt;
      vertical-align: top;
      height: 17mm;
    }

    .mom-table .sr-no {
      width: 35px;
      text-align: center;
      font-weight: bold;
    }

    /* Footer */
    .footer {
      margin-top: 8mm;
      display: flex;
      justify-content: space-between;
      padding: 0 20px;
      font-size: 8.5pt;
    }

    .signature-block {
      text-align: center;
      line-height: 1.8;
    }

    .signature-line {
      margin-top: 20px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="page-border">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <div class="company-name">TRiMiTY</div>
        <div class="company-subtitle">CONSULTANTS</div>
      </div>
      <div class="address-box">
        1402-B, Yash Anant, Ashram road,<br>
        Opposite old Reserve bank of India,<br>
        Navrangpura, Ahmedabad, Gujarat 380009
      </div>
    </div>
    <div class="contact-info">
      <strong>E mail:</strong> trimityconsultants@gmail.com &nbsp;&nbsp;
      <strong>Website:</strong> www.trimity.co.in &nbsp;&nbsp;
      <strong>Mobile No:</strong> +91 9662474538
    </div>

    <!-- Info Section -->
    <div class="info-section">
      <div class="info-row top-row">
        <div>
          <span class="info-label">Project name :-</span>
          <span class="info-value">${this.escapeHtml(taskTitle || title)}</span>
        </div>
        <div>
          <span class="info-label">Date of visit :-</span>
          <span class="info-value">${date}</span>
        </div>
      </div>
      
      <div class="info-row">
        <span class="info-label">Participant name :-</span>
        <span class="participant-list">${attendeesList || 'N/A'}</span>
      </div>
      
      <div class="info-row">
        <span class="info-label">Site visit :-</span>
        <span class="info-value underline">${this.escapeHtml(location)}</span>
      </div>
    </div>

    <!-- MOM Title -->
    <div class="mom-title">Minutes of Meeting (MoM)</div>

    <!-- MOM Table -->
    <table class="mom-table">
      ${rowsHTML}
    </table>

    <!-- Footer -->
    <div class="footer">
      <div class="signature-block">
        <div>Trimity Consultants engineer name and sign</div>
        <div class="signature-line">(Eng-First)</div>
      </div>
      <div class="signature-block">
        <div>Consultant/client sign</div>
        <div class="signature-line">(Client Name)</div>
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
        <tr>
          <td class="sr-no">${i + 1}.</td>
          <td>${this.escapeHtml(point)}</td>
        </tr>
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
