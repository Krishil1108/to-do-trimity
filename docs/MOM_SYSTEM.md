# Minutes of Meeting (MOM) System

## Overview

The MOM (Minutes of Meeting) system allows you to generate professional PDF documents from meeting notes. It supports:
- **Multiple languages**: English, Gujarati, and improper English
- **AI-powered text improvement**: Automatically corrects grammar and improves clarity
- **Professional PDF letterhead**: Generates formatted PDFs with company branding
- **No database storage**: PDFs are generated on-demand and downloaded directly

## Features

### 1. **Language Support**
- **English**: Processes and improves grammar and structure
- **Gujarati**: Automatically detects and translates to English
- **Mixed/Improper English**: Corrects and professionalizes text

### 2. **AI Text Processing**
- Automatic language detection
- Translation from Gujarati to English
- Grammar correction
- Professional formatting
- Maintains original meaning and context

### 3. **PDF Generation**
- Professional letterhead design
- Formatted meeting details
- Attendees list
- Meeting content with proper structure
- Signature area
- Page numbers and timestamps
- Company branding

### 4. **Automatic Cleanup**
- PDFs are generated temporarily
- Automatically deleted after download
- No storage in database
- Privacy-focused approach

## API Endpoints

### 1. Process Text Only

Process and improve text without generating PDF.

```http
POST /api/mom/process-text
Content-Type: application/json

{
  "text": "todays meetin was abot the new project..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Text processed successfully",
  "data": {
    "original": "todays meetin was abot...",
    "detectedLanguage": "en",
    "wasTranslated": false,
    "improved": "Today's meeting was about the new project...",
    "final": "Today's meeting was about the new project..."
  }
}
```

### 2. Generate PDF

Generate a complete MOM PDF with letterhead.

```http
POST /api/mom/generate-pdf
Content-Type: application/json

{
  "taskId": "65f8a9b3c2d1e4f5a6b7c8d9",
  "title": "Project Kickoff Meeting",
  "date": "December 30, 2025",
  "time": "10:00 AM - 11:00 AM",
  "location": "Conference Room A",
  "attendees": [
    "John Smith - Project Manager",
    "Mary Johnson - Developer"
  ],
  "rawContent": "todays meetin was abot the new project. we discus timeline and budjet.",
  "companyName": "Trido Task Management"
}
```

**Response:**
- Downloads PDF file directly
- Filename: `MOM_[TaskTitle]_[TaskID]_[Timestamp].pdf`

### 3. Complete Generation (All-in-One)

Process text and generate PDF in a single call.

```http
POST /api/mom/generate-complete
Content-Type: application/json

{
  "taskId": "optional-task-id",
  "title": "Weekly Team Meeting",
  "date": "December 30, 2025",
  "time": "2:00 PM",
  "location": "Online - Zoom",
  "attendees": ["Team Member 1", "Team Member 2"],
  "rawContent": "Meeting notes here...",
  "companyName": "Your Company Name"
}
```

## Usage Examples

### Example 1: Basic MOM Generation

```javascript
// Frontend code
const generateMOM = async () => {
  const formData = {
    title: "Sprint Planning Meeting",
    date: new Date().toLocaleDateString(),
    time: "10:00 AM",
    location: "Office",
    attendees: ["Alice", "Bob", "Charlie"],
    rawContent: "we discuss sprint goals and assign tasks",
    companyName: "Trido"
  };

  const response = await fetch('/api/mom/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'meeting_minutes.pdf';
  a.click();
};
```

### Example 2: With Gujarati Content

```javascript
const momData = {
  title: "પ્રોજેક્ટ મીટિંગ",
  rawContent: "આજે અમે નવા પ્રોજેક્ટની શરૂઆત કરી. બધા ટીમ મેમ્બર્સ હાજર હતા.",
  attendees: ["રાજ", "પ્રિયા", "અર્જુન"]
};

// The system will:
// 1. Detect Gujarati language
// 2. Translate to English
// 3. Improve the text
// 4. Generate professional PDF
```

### Example 3: Linked to Task

```javascript
const generateTaskMOM = async (taskId) => {
  const momData = {
    taskId: taskId, // Links to specific task
    title: "Task Review Meeting",
    rawContent: "task progress is gud. almost done.",
    attendees: ["Manager", "Developer"]
  };

  // System will fetch task details automatically
  const response = await fetch('/api/mom/generate-complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(momData)
  });
  
  // Download PDF
  const blob = await response.blob();
  saveAs(blob, 'task_meeting_minutes.pdf');
};
```

## Testing

Run the test script to verify the MOM system:

```bash
cd backend
node test-mom.js
```

This will:
1. Process improper English text
2. Test Gujarati translation
3. Generate a sample PDF
4. Display results in console

## Configuration

### Optional: AI Enhancement

For better text improvement, add Gemini API key to your `.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

**Without API key:** System uses basic text cleanup
**With API key:** Advanced AI-powered text improvement

Get a free Gemini API key at: https://makersuite.google.com/app/apikey

## PDF Letterhead Customization

The letterhead includes:
- Company name (customizable via `companyName` parameter)
- Professional blue header
- Company tagline
- Meeting details section
- Formatted content area
- Signature area
- Footer with timestamp and page numbers

To customize the letterhead design, edit:
```
backend/services/pdfGenerationService.js
```

Modify the `addLetterhead()` method to change:
- Colors
- Fonts
- Logo (if you add image support)
- Layout

## Frontend Integration

### HTML Form Example

```html
<form id="momForm">
  <input type="text" name="title" placeholder="Meeting Title" required>
  <input type="date" name="date" required>
  <input type="time" name="time">
  <input type="text" name="location" placeholder="Location">
  <textarea name="attendees" placeholder="Attendees (one per line)"></textarea>
  <textarea name="rawContent" placeholder="Meeting notes..." required></textarea>
  <button type="submit">Generate PDF</button>
</form>

<script>
document.getElementById('momForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  const data = {
    title: formData.get('title'),
    date: formData.get('date'),
    time: formData.get('time'),
    location: formData.get('location'),
    attendees: formData.get('attendees').split('\n').filter(a => a.trim()),
    rawContent: formData.get('rawContent')
  };

  const response = await fetch('/api/mom/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MOM_${Date.now()}.pdf`;
  a.click();
});
</script>
```

## Troubleshooting

### PDF Not Generating

1. **Check permissions**: Ensure `backend/temp/` directory is writable
2. **Check packages**: Verify `pdfkit` is installed
3. **Check logs**: Look for errors in server console

### Translation Not Working

1. **Internet required**: Translation requires internet connection
2. **Fallback active**: Without internet, uses basic cleanup
3. **Check text**: Ensure text contains Gujarati characters

### Text Not Improving

1. **API Key**: For best results, add `GEMINI_API_KEY` to `.env`
2. **Fallback mode**: Without API, basic cleanup is applied
3. **Check input**: Ensure text is not empty

## Best Practices

1. **Keep notes concise**: Shorter text processes faster
2. **Use bullet points**: Easier to format and read
3. **Include attendees**: Makes MOM more official
4. **Add timestamps**: Helps with record keeping
5. **Review before generating**: Check content is accurate

## Security Notes

- PDFs are temporary and auto-deleted
- No sensitive data stored in database
- Text processing happens server-side
- API keys stored securely in `.env`
- Downloads are direct (no public URLs)

## Future Enhancements

Potential improvements:
- Custom letterhead upload
- Multiple template options
- Email distribution
- Digital signatures
- Archive option (with user permission)
- Multilingual support (Hindi, etc.)

---

**Ready to use!** Start generating professional meeting minutes with automatic language processing and beautiful PDF formatting.
