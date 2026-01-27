# 🚀 Quick Start Guide - Word Template PDF Generation

## What's New?

You can now use your **own Word document letterhead** for MOM PDFs! The system will automatically insert the reframed/processed meeting content into your template.

**🎨 NEW:** Image support added! Include logos, signatures, photos, and screenshots in your PDFs.

## How to Get Started (3 Simple Steps)

### Step 1: Create Your Word Template (5 minutes)

1. Open Microsoft Word
2. Design your letterhead:
   - Add logo, company name, address
   - Add headers and footers
   - Style as you want
3. Add placeholders where you want data:
   ```
   {%companyLogo}           ← Image placeholders use {%...}
   {companyName}
   {documentTitle}
   {meetingTitle}
   {meetingDate}
   {meetingTime}
   {meetingLocation}
   
   Attendees:
   {#attendees}
   • {name}
   {/attendees}
   
   MEETING NOTES:
   {content}
   
   {%signature}             ← Add signature image
   ```
4. Save as: `letterhead.docx`
5. Place in: `backend/templates/letterhead.docx`

### Step 2: Install LibreOffice (Optional but Recommended)

For automatic PDF conversion:
- Download: https://www.libreoffice.org/download/
- Install with default settings
- Restart backend server

Without LibreOffice, files will be saved as DOCX format.

### Step 3: Use the New API Endpoint

```javascript
// Use this endpoint instead of /generate-pdf
POST /api/mom/generate-pdf-from-template

// Request body (same as before)
{
  "taskId": "task123",
  "title": "Meeting Title",
  "date": "January 2, 2026",
  "time": "10:00 AM",
  "location": "Conference Room",
  "attendees": ["John Doe", "Jane Smith"],
  "rawContent": "Meeting discussion...",
  "companyName": "Trimity Consultants",
  "images": [                              // NEW: Add images!
    {
      "name": "companyLogo",
      "data": "uploads/images/logo.png"
    },
    {
      "name": "signature",
      "data": "uploads/images/signature.png"
    }
  ]
}
```

## Available Placeholders

| Placeholder | What it shows |
|------------|---------------|
| `{companyName}` | Your company name |
| `{documentTitle}` | "MINUTES OF MEETING" |
| `{meetingTitle}` | Meeting or task name |
| `{meetingDate}` | Meeting date |
| `{meetingTime}` | Meeting time |
| `{meetingLocation}` | Location/mode |
| `{content}` | **Reframed meeting content** ⭐ |
| `{generatedDate}` | When PDF was created |

### For Attendees List:
```
{#attendees}
• {name}
{/attendees}
```

### For Images (NEW! 🎨):
```
{%logo}              ← Company logo (150x50px)
{%companyLogo}       ← Larger logo (200x80px)
{%signature}         ← Digital signature (150x50px)
{%photo}             ← Photos (300x300px)
{%screenshot}        ← Screenshots (500x400px)
{%image1}, {%image2} ← Generic images (400x300px)
```

**See [Image Support Documentation](./IMAGE_SUPPORT_DOCUMENTATION.md) for complete guide!**

## Important Rules

✅ **Do:**
- Save template as `letterhead.docx` exactly
- Place in `backend/templates/` folder
- Use curly braces `{}` for placeholders
- Use standard fonts (Arial, Calibri)
- Test with sample data first

❌ **Don't:**
- Use different filename
- Use .doc or .docm format
- Misspell placeholders (case-sensitive!)
- Use parentheses `()` or brackets `[]`

## Example Template Layout

```
┌─────────────────────────────────────────┐
│  [LOGO]    TRIMITY CONSULTANTS          │
│            Address Line                 │
│            Contact Info                 │
├─────────────────────────────────────────┤
│                                         │
│     MINUTES OF MEETING                  │
│                                         │
│  Project: {meetingTitle}                │
│  Date: {meetingDate}                    │
│  Time: {meetingTime}                    │
│  Location: {meetingLocation}            │
│                                         │
│  Attendees:                             │
│  {#attendees}• {name}{/attendees}       │
│                                         │
│  ─────────────────────────────────      │
│                                         │
│  MEETING NOTES:                         │
│  {content}                              │
│                                         │
├─────────────────────────────────────────┤
│  Generated: {generatedDate}             │
└─────────────────────────────────────────┘
```

## Testing

1. Create and save your template
2. Restart backend: `npm start`
3. Test with API call or frontend
4. Check the downloaded PDF
5. Adjust template as needed

## Troubleshooting

**"Template not found"**
→ Check file is at `backend/templates/letterhead.docx`

**Placeholders not replaced**
→ Check spelling, use exact case, use `{}` braces

**No PDF, only DOCX**
→ Install LibreOffice for PDF conversion

**Content looks wrong**
→ Use simpler layout, standard fonts, test with short content first

## Need More Help?

- 📖 Full Guide: `docs/WORD_TEMPLATE_DOCUMENTATION.md`
- 🎨 Image Support: `docs/IMAGE_SUPPORT_DOCUMENTATION.md` ← **NEW!**
- 🎨 Visual Guide: `backend/templates/TEMPLATE_CREATION_GUIDE.html`
- 📝 Template Info: `backend/templates/README.md`

## What Gets Inserted?

The `{content}` placeholder receives your **reframed/processed meeting content**:
- Original content (Gujarati/English) → Translated
- Grammar corrected
- Professional tone
- Well-structured
- Ready for official documents

This ensures your letterhead looks professional with polished content!

---

**Ready to start?** Create your `letterhead.docx` template and place it in `backend/templates/`!
