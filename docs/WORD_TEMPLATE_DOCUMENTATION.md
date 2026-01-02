# Word Template PDF Generation - Complete Documentation

## 📋 Overview

This feature allows you to generate professional MOM (Minutes of Meeting) PDFs using your own Microsoft Word letterhead template. The system automatically inserts the reframed/processed meeting content into your template and converts it to PDF.

## 🎯 Key Features

- ✅ Use your actual company letterhead design
- ✅ Automatic insertion of reframed meeting content
- ✅ Support for dynamic attendee lists
- ✅ Professional formatting maintained
- ✅ Automatic PDF conversion
- ✅ Fallback to DOCX if PDF conversion unavailable

## 🚀 Quick Start

### Step 1: Create Your Word Template

1. Open Microsoft Word
2. Design your letterhead with logo, company info, headers, footers
3. Add placeholders where you want dynamic content (see Placeholder List below)
4. Save as `letterhead.docx`
5. Place in `backend/templates/letterhead.docx`

### Step 2: Use the API

Make a POST request to `/api/mom/generate-pdf-from-template`:

```javascript
// Example request
fetch('/api/mom/generate-pdf-from-template', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    taskId: 'task123',
    title: 'Project Kickoff Meeting',
    date: 'January 2, 2026',
    time: '10:00 AM',
    location: 'Conference Room A',
    attendees: ['John Doe', 'Jane Smith'],
    rawContent: 'Meeting discussion content...',
    companyName: 'Trimity Consultants'
  })
})
```

## 📝 Available Placeholders

### Basic Information
| Placeholder | Description | Example |
|------------|-------------|---------|
| `{companyName}` | Company name | Trimity Consultants |
| `{documentTitle}` | Document type | MINUTES OF MEETING |
| `{meetingTitle}` | Meeting/task title | Project Kickoff |
| `{meetingDate}` | Meeting date | January 2, 2026 |
| `{meetingTime}` | Meeting time | 10:00 AM |
| `{meetingLocation}` | Meeting location | Conference Room A |
| `{taskId}` | Task reference | TASK-123 |
| `{generatedDate}` | PDF generation date | January 2, 2026 |

### Content
| Placeholder | Description |
|------------|-------------|
| `{content}` | **Main meeting content (reframed/processed)** |

### Loops (Repeating Sections)

#### Attendees List
```
{#attendees}
  • {name}
{/attendees}
```

This creates a bullet point for each attendee.

#### Content Sections (with headers)
```
{#contentSections}
  {title}
  {text}
  
{/contentSections}
```

This breaks content into sections with headers.

## 📄 Template Creation Guide

### Basic Template Structure

```
┌─────────────────────────────────────────────────────┐
│  [LOGO]              {companyName}                  │
│                      Address Line                   │
│                      Contact Info                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│            {documentTitle}                          │
│                                                     │
│  Project: {meetingTitle}                           │
│  Date: {meetingDate}                               │
│  Time: {meetingTime}                               │
│  Location: {meetingLocation}                       │
│                                                     │
│  Attendees:                                        │
│  {#attendees}                                      │
│    • {name}                                        │
│  {/attendees}                                      │
│                                                     │
│  ─────────────────────────────────────────────     │
│                                                     │
│  MEETING NOTES:                                    │
│                                                     │
│  {content}                                         │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Generated: {generatedDate}                        │
│  {documentFooter}                                  │
└─────────────────────────────────────────────────────┘
```

### Using Tables for Layout

Word tables help maintain consistent layout:

```
┌─────────────────┬──────────────────────┐
│ Project/Task    │ {meetingTitle}       │
├─────────────────┼──────────────────────┤
│ Date            │ {meetingDate}        │
├─────────────────┼──────────────────────┤
│ Time            │ {meetingTime}        │
├─────────────────┼──────────────────────┤
│ Location        │ {meetingLocation}    │
└─────────────────┴──────────────────────┘
```

### Formatting Tips

1. **Bold placeholders**: Make the placeholder bold to get bold output
2. **Colors**: Apply colors to placeholders to maintain that styling
3. **Fonts**: Use standard fonts (Arial, Calibri, Times New Roman)
4. **Margins**: Keep at least 0.5" margin on all sides
5. **Tables**: Use tables for structured layouts
6. **Line spacing**: Use 1.5 or double spacing for readability

### Important Rules

⚠️ **Critical Requirements:**
- File MUST be named exactly `letterhead.docx`
- Must be saved in `backend/templates/` directory
- Must be `.docx` format (not .doc or .docm)
- Placeholders are case-sensitive: `{companyName}` ≠ `{companyname}`
- Use curly braces `{}` not `()` or `[]`
- Save in docx format with Word 2007 or later

## 🔌 API Endpoints

### 1. Generate PDF from Template (New MOM)

**Endpoint:** `POST /api/mom/generate-pdf-from-template`

**Request Body:**
```json
{
  "taskId": "task123",
  "title": "Meeting Title",
  "date": "January 2, 2026",
  "time": "10:00 AM",
  "location": "Conference Room",
  "attendees": ["John Doe", "Jane Smith"],
  "rawContent": "Meeting content...",
  "companyName": "Trimity Consultants",
  "templateName": "letterhead.docx"  // Optional
}
```

**Response:**
- Downloads PDF file
- Status 200: Success
- Status 400: Missing required fields
- Status 404: Template not found
- Status 500: PDF generation failed

**Error Response (Template Not Found):**
```json
{
  "success": false,
  "error": "Word template not found",
  "message": "Please create a Word template file named 'letterhead.docx' in the backend/templates/ folder.",
  "momId": "saved_mom_id"
}
```

### 2. Regenerate PDF from History

**Endpoint:** `POST /api/mom/regenerate-from-template/:momId`

**Request Body:**
```json
{
  "templateName": "letterhead.docx"  // Optional
}
```

**Response:**
- Downloads regenerated PDF file

**Use Case:**
- Regenerate PDFs from saved MOMs in history
- Use updated template design
- Convert old MOMs to new format

## 🛠️ Setup Instructions

### Prerequisites
- Node.js installed
- Microsoft Word (for creating templates)
- LibreOffice (optional, for PDF conversion)

### Installation

1. **Install npm packages** (already done):
```bash
cd backend
npm install docxtemplater pizzip docx-pdf
```

2. **Create templates directory**:
```bash
mkdir backend/templates
```

3. **Install LibreOffice** (recommended for best PDF quality):

**Windows:**
- Download: https://www.libreoffice.org/download/
- Install to default location: `C:\Program Files\LibreOffice`

**Linux:**
```bash
sudo apt-get install libreoffice
```

**Mac:**
```bash
brew install libreoffice
```

4. **Restart backend server** after LibreOffice installation

### Without LibreOffice

If LibreOffice is not installed:
- System will generate DOCX files instead of PDF
- Files can still be opened and converted manually
- Consider installing LibreOffice for automatic PDF conversion

## 📁 File Structure

```
backend/
├── services/
│   ├── wordTemplatePdfService.js    ← New service
│   ├── puppeteerPdfService.js       ← Existing service
│   └── textProcessingService.js     ← Content processing
├── templates/
│   ├── letterhead.docx              ← YOUR TEMPLATE (create this)
│   ├── letterhead-formal.docx       ← Optional
│   ├── README.md                    ← Template guide
│   └── TEMPLATE_CREATION_GUIDE.html ← Visual guide
├── temp/
│   └── (Generated PDFs - auto-deleted)
└── routes/
    └── mom.js                        ← Updated with new endpoints
```

## 🎨 Multiple Templates

You can create multiple templates for different scenarios:

### Template Naming
```
letterhead.docx           - Default template
letterhead-formal.docx    - Formal meetings
letterhead-internal.docx  - Internal meetings
letterhead-client.docx    - Client meetings
```

### Usage
```javascript
// Use specific template
{
  ...
  templateName: 'letterhead-formal.docx'
}
```

## 🔍 Content Processing Flow

1. **User enters raw content** (can be Gujarati/English, casual)
2. **TextProcessingService processes it**:
   - Translates Gujarati to English if needed
   - Corrects grammar
   - Improves professionalism
   - Structures content
3. **Processed content inserted into template**
4. **Word template filled with data**
5. **Converted to PDF**
6. **Downloaded to user**

## 📊 Data Flow

```
User Input (Raw Content)
    ↓
Text Processing Service
    ↓
Processed/Reframed Content
    ↓
Word Template Service
    ↓
Fill Template with Data
    ↓
Generate DOCX
    ↓
Convert to PDF (LibreOffice)
    ↓
Download to User
```

## 🐛 Troubleshooting

### Issue: Template not found

**Solution:**
1. Check file exists: `backend/templates/letterhead.docx`
2. Verify filename spelling (case-sensitive)
3. Ensure it's in the correct directory
4. Check file permissions

### Issue: Placeholders not replaced

**Solution:**
1. Verify placeholder spelling: `{companyName}` not `{companyname}`
2. Ensure curly braces `{}` are used
3. Check there are no extra spaces: `{companyName}` not `{ companyName }`
4. Re-type placeholders in Word (don't copy-paste)

### Issue: PDF conversion fails

**Solution:**
1. Install LibreOffice
2. Check LibreOffice installation path
3. Restart backend server after installing LibreOffice
4. Check backend logs for detailed error

### Issue: Formatting looks wrong

**Solution:**
1. Use standard fonts (Arial, Calibri, Times New Roman)
2. Avoid complex Word features
3. Use tables for layout instead of text boxes
4. Simplify the design
5. Test with sample content first

### Issue: Content is cut off

**Solution:**
1. Check page margins (should be at least 0.5")
2. Reduce font sizes if needed
3. Use Word's page layout tools
4. Test with typical content length

## 📚 Advanced Features

### Conditional Content

Show content only if value exists:
```
{#meetingTime}
Time: {meetingTime}
{/meetingTime}
```

### Nested Loops

```
{#contentSections}
  Section: {title}
  
  {#items}
    • {item}
  {/items}
{/contentSections}
```

### Custom Filters (Advanced)

Modify `prepareTemplateData()` in `wordTemplatePdfService.js` to add custom data transformations.

## 🧪 Testing

### Test Checklist

- [ ] Template file exists in correct location
- [ ] All placeholders spelled correctly
- [ ] LibreOffice installed (if PDF conversion needed)
- [ ] Backend server restarted after changes
- [ ] Test with sample data first
- [ ] Check PDF output quality
- [ ] Verify all content sections appear
- [ ] Test with long content
- [ ] Test with multiple attendees

### Test API Call

```bash
curl -X POST http://localhost:5000/api/mom/generate-pdf-from-template \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Meeting",
    "date": "January 2, 2026",
    "time": "10:00 AM",
    "location": "Test Room",
    "attendees": ["Test User"],
    "rawContent": "This is test content.",
    "companyName": "Trimity Consultants"
  }'
```

## 💡 Best Practices

1. **Keep templates simple**: Complex designs may not convert well
2. **Use tables**: Better layout control
3. **Test frequently**: Generate PDFs while designing
4. **Version templates**: Keep backup copies
5. **Document placeholders**: List all used placeholders
6. **Use standard fonts**: Better compatibility
7. **Set fixed widths**: Avoid auto-sizing
8. **Page breaks**: Use proper page break controls
9. **Test with real data**: Use actual meeting content
10. **Maintain consistency**: Use same template structure

## 🔐 Security Notes

- Templates are server-side only
- No user-uploaded templates (security risk)
- Templates must be placed by administrators
- Generated PDFs are temporary (auto-deleted)

## 📈 Performance

- Template loading: ~100ms
- Content processing: ~2-5 seconds (AI processing)
- DOCX generation: ~200-500ms
- PDF conversion: ~1-3 seconds (with LibreOffice)
- Total: ~3-10 seconds per MOM

## 🆘 Support

### Quick Reference Files

1. `TEMPLATE_CREATION_GUIDE.html` - Visual guide with examples
2. `README.md` (in templates/) - Detailed instructions
3. `WORD_TEMPLATE_DOCUMENTATION.md` - This file

### Need Help?

1. Check backend console logs for detailed errors
2. Review template placeholder spelling
3. Verify LibreOffice installation
4. Test with sample template first
5. Check file permissions

## 📝 Changelog

### Version 1.0 (January 2026)
- Initial release
- Word template support
- Automatic content insertion
- PDF conversion with LibreOffice
- Multiple template support
- History regeneration support

## 📄 License

Part of Trido Task Management System
© 2026 Trimity Consultants
