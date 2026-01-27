# Word Template PDF Generation - Setup Guide

## Overview
This system allows you to generate professional PDFs from your own Word document letterhead template. The reframed/processed content from the MOM system will be automatically inserted into your Word template.

## How It Works
1. You create a Word document (.docx) with your company letterhead design
2. Add placeholder tags (like `{companyName}`, `{content}`, etc.) where you want dynamic content
3. The system reads your template, replaces placeholders with actual data, and converts to PDF

## Creating Your Word Template

### Step 1: Design Your Letterhead in Word
1. Open Microsoft Word
2. Create your letterhead design:
   - Add your company logo (Insert → Pictures)
   - Add company name, address, contact details
   - Add header/footer with your branding
   - Design borders, colors, and styling as needed
   - Set page margins and layout

### Step 2: Add Placeholder Tags
Add these placeholders where you want dynamic content to appear:

#### Basic Placeholders:
```
{companyName}          - Company name (e.g., "Trimity Consultants")
{documentTitle}        - Document title (e.g., "MINUTES OF MEETING")
{meetingTitle}         - Specific meeting title or task name
{meetingDate}          - Date of the meeting
{meetingTime}          - Time of the meeting
{meetingLocation}      - Location/mode of meeting
{taskId}               - Task ID reference
{generatedDate}        - Date when document was generated
```

#### Content Placeholders:
```
{content}              - All processed/reframed meeting content
```

#### Attendees Section (Loop):
To display a list of attendees, use this format:
```
{#attendees}
  - {name}
{/attendees}
```

This will create a bullet point for each attendee.

#### Images (NEW! 🎨):
Add images to your template using the image placeholder syntax:
```
{%logo}              - Company logo (150x50px)
{%companyLogo}       - Larger logo (200x80px)
{%signature}         - Digital signature (150x50px)
{%photo}             - Photos (300x300px)
{%screenshot}        - Screenshots/diagrams (500x400px)
{%headerImage}       - Header images (600x200px)
{%banner}            - Banner images (650x150px)
{%image1}            - Generic image 1 (400x300px)
{%image2}            - Generic image 2 (400x300px)
```

**Important:** Image placeholders use `{%imageName}` (with % sign) instead of `{imageName}`.

**See detailed image documentation:** `../../docs/IMAGE_SUPPORT_DOCUMENTATION.md`

#### Content Sections (Loop):
To display content broken into sections with headers:
```
{#contentSections}
  {title}
  {text}
  
{/contentSections}
```

### Step 3: Example Template Layout

Here's a sample layout for your Word document:

```
┌─────────────────────────────────────────────────────┐
│  {%companyLogo}                                     │
│                             {companyName}           │
│                             Address Line 1          │
│                             Phone: XXX-XXX-XXXX     │
├─────────────────────────────────────────────────────┤
│                                                     │
│              {documentTitle}                        │
│                                                     │
│  Project/Task: {meetingTitle}                      │
│  Date: {meetingDate}                               │
│  Time: {meetingTime}                               │
│  Location: {meetingLocation}                       │
│                                                     │
│  Attendees:                                        │
│  {#attendees}                                      │
│    • {name}                                        │
│  {/attendees}                                      │
│                                                     │
│  ───────────────────────────────────────────────   │
│                                                     │
│  MEETING NOTES:                                    │
│                                                     │
│  {content}                                         │
│                                                     │
│  {%screenshot}                                     │
│  ↑ Optional: Add screenshots or diagrams           │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Generated: {generatedDate}                        │
│  Prepared by: {preparedBy}                         │
│  {%signature}                                      │
│  {documentFooter}                                  │
└─────────────────────────────────────────────────────┘
```

### Step 4: Advanced Formatting Tips

#### Conditional Content:
Show content only if a value exists:
```
{#meetingTime}Time: {meetingTime}{/meetingTime}
```

#### Tables:
You can use Word tables and put placeholders in cells:
```
┌────────────────┬──────────────────┐
│ Meeting Date   │ {meetingDate}    │
├────────────────┼──────────────────┤
│ Location       │ {meetingLocation}│
└────────────────┴──────────────────┘
```

#### Text Formatting:
- **Bold placeholders**: The value will appear in bold
- *Italic placeholders*: The value will appear in italic
- <u>Underlined</u>: The value will appear underlined
- Font colors and sizes are preserved

### Step 5: Save Your Template
1. Save your Word document as `letterhead.docx`
2. Place it in: `backend/templates/letterhead.docx`

**Important**: The file MUST be saved as `.docx` format (not .doc or .docm)

## Using Multiple Templates

You can create multiple templates for different purposes:

1. `letterhead.docx` - Default template
2. `letterhead-formal.docx` - Formal meetings
3. `letterhead-internal.docx` - Internal meetings
4. `letterhead-client.docx` - Client meetings

Specify which template to use when generating the PDF (see API documentation below).

## File Locations

### Template Directory:
```
backend/templates/
  ├── letterhead.docx          (Your main template)
  ├── letterhead-formal.docx   (Optional: formal template)
  └── README.md                (This file)
```

### Generated Files:
- Temporary DOCX files: `backend/temp/` (auto-deleted)
- Final PDFs: Downloaded directly or saved in `backend/temp/`

## Testing Your Template

### Step 1: Place your template
Copy your `letterhead.docx` to `backend/templates/`

### Step 2: Test with the API
Use the new endpoint:
```bash
POST /api/mom/generate-pdf-from-template
```

### Step 3: Check the output
The system will:
1. Read your template
2. Replace all placeholders with actual data
3. Convert to PDF
4. Download the file

## Troubleshooting

### Common Issues:

1. **"Template not found" error**
   - Make sure `letterhead.docx` exists in `backend/templates/`
   - Check the filename is exactly `letterhead.docx`

2. **Placeholders not replaced**
   - Check spelling: `{companyName}` not `{companyname}`
   - Placeholders are case-sensitive
   - Make sure braces are curly `{}` not parentheses `()` or square `[]`

3. **PDF conversion fails**
   - Install LibreOffice for best results (see below)
   - The system will fall back to DOCX format if PDF conversion fails

4. **Formatting looks different in PDF**
   - Some complex Word formatting may not convert perfectly
   - Use standard fonts (Arial, Times New Roman, Calibri)
   - Avoid very complex layouts

### Installing LibreOffice (for PDF conversion)

**Windows:**
1. Download from: https://www.libreoffice.org/download/
2. Install to default location: `C:\Program Files\LibreOffice`
3. Restart the backend server

**Linux/Mac:**
```bash
# Ubuntu/Debian
sudo apt-get install libreoffice

# Mac
brew install libreoffice
```

## API Documentation

### Generate PDF from Template

**Endpoint:** `POST /api/mom/generate-pdf-from-template`

**Request Body:**
```json
{
  "taskId": "task123",
  "title": "Project Kickoff Meeting",
  "date": "January 2, 2026",
  "time": "10:00 AM",
  "location": "Conference Room A",
  "attendees": ["John Doe", "Jane Smith", "Bob Wilson"],
  "rawContent": "Discussion about project timeline...",
  "companyName": "Trimity Consultants",
  "templateName": "letterhead.docx",  // Optional, defaults to "letterhead.docx"
  "images": [                          // Optional - NEW!
    {
      "name": "companyLogo",
      "data": "uploads/images/company-logo.png"
    },
    {
      "name": "signature",
      "data": "uploads/images/manager-signature.png"
    },
    {
      "name": "screenshot",
      "data": "data:image/png;base64,iVBORw0KGgoAAAANS..."
    }
  ]
}
```

**Response:**
- Downloads the generated PDF file

### Using Different Templates

To use a different template, specify the `templateName`:

```json
{
  ...
  "templateName": "letterhead-formal.docx"
}
```

## Sample Template

A basic sample template is provided in this directory as `letterhead-sample.docx`. You can use it as a starting point and customize it with your own branding.

## Advanced Usage

### Custom Data Fields

You can add any custom fields to the template by modifying `wordTemplatePdfService.js`:

1. Open `backend/services/wordTemplatePdfService.js`
2. Find the `prepareTemplateData()` method
3. Add your custom fields to the returned object

Example:
```javascript
return {
  // ... existing fields ...
  projectManager: 'John Doe',
  department: 'IT Department',
  customField: 'Custom Value'
};
```

Then use in your template:
```
Project Manager: {projectManager}
Department: {department}
```

## Tips for Best Results

1. **Keep it simple**: Simple layouts convert better to PDF
2. **Use standard fonts**: Avoid exotic fonts that may not render
3. **Test frequently**: Generate PDFs often while designing
4. **Use tables**: Tables help maintain layout consistency
5. **Set fixed widths**: Use fixed column widths rather than auto
6. **Avoid text boxes**: Use regular text instead of text boxes
7. **Page breaks**: Use Word's page break feature for multi-page documents

## Getting Help

If you encounter issues:
1. Check the backend console logs for detailed error messages
2. Verify your template has all placeholders spelled correctly
3. Test with the sample template first
4. Check that LibreOffice is installed for PDF conversion

## License

This template system is part of the Trido Task Management System.
