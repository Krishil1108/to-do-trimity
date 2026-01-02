# Creating Your letterhead.docx Template

## Template Name
**File name:** `letterhead.docx`
**Location:** `backend/templates/letterhead.docx`

## How to Create

### Option 1: Start from Scratch

1. **Open Microsoft Word**
   - Create new blank document
   - Set page size: A4 (Letter)
   - Set margins: 0.75" on all sides

2. **Add Company Header**
   ```
   - Insert your company logo (Insert → Pictures)
   - Type company name in large, bold font
   - Add address, phone, email below
   - Style with your brand colors
   ```

3. **Add Document Title Area**
   ```
   Center-aligned, large font:
   {documentTitle}
   ```

4. **Add Meeting Details Table**
   ```
   Insert → Table (2 columns, 4+ rows)
   
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

5. **Add Attendees Section**
   ```
   Type:
   
   Attendees:
   {#attendees}
   • {name}
   {/attendees}
   ```

6. **Add Content Area**
   ```
   Type:
   
   MEETING NOTES:
   _____________________________________________
   
   {content}
   ```

7. **Add Footer**
   ```
   Insert → Footer
   
   Generated: {generatedDate}
   This is a computer-generated document from {companyName}
   Page {PAGE}
   ```

8. **Save**
   - File → Save As
   - Location: `backend/templates/`
   - File name: `letterhead.docx`
   - Save as type: Word Document (*.docx)

### Option 2: Use Existing Letterhead

If you already have a company letterhead:

1. **Open your existing letterhead file**
2. **Delete sample content** (keep logo, headers, footers)
3. **Add placeholders** in the main body:
   ```
   {documentTitle}
   
   Project/Task: {meetingTitle}
   Date: {meetingDate}
   Time: {meetingTime}
   Location: {meetingLocation}
   
   Attendees:
   {#attendees}
   • {name}
   {/attendees}
   
   MEETING NOTES:
   {content}
   ```
4. **Save As** `letterhead.docx` in `backend/templates/`

## All Available Placeholders

Copy and paste these into your template:

```
{companyName}
{documentTitle}
{meetingTitle}
{meetingDate}
{meetingTime}
{meetingLocation}
{taskId}
{generatedDate}
{content}
{documentFooter}

For attendees list:
{#attendees}
• {name}
{/attendees}

For content sections:
{#contentSections}
{title}
{text}

{/contentSections}
```

## Styling Tips

### Fonts
- Company name: 20-24pt, Bold, Your brand color
- Document title: 16-18pt, Bold, Center-aligned
- Section headers: 12-14pt, Bold
- Body text: 11-12pt, Regular
- Footer: 8-10pt, Gray

### Colors
- Use your company brand colors
- Keep it professional
- Don't overuse colors

### Layout
- Use tables for structured information
- Add horizontal lines to separate sections
- Keep adequate white space
- Use bullet points for lists

## Example Template Content

Here's what to type in your Word document:

```
[Your Logo Image Here]

TRIMITY CONSULTANTS
1402-B, Yash Anant, Ashram Road, Ahmedabad
Phone: +91-XXXXXXXXXX | Email: info@trimity.com

═══════════════════════════════════════════════════

{documentTitle}

Project/Task: {meetingTitle}
Date: {meetingDate}
Time: {meetingTime}
Location: {meetingLocation}

Attendees:
{#attendees}
• {name}
{/attendees}

─────────────────────────────────────────────────

MEETING NOTES:

{content}

═══════════════════════════════════════════════════

Generated: {generatedDate}
{documentFooter}
```

## Checklist Before Saving

- [ ] File name is exactly `letterhead.docx`
- [ ] Saved in `backend/templates/` folder
- [ ] File format is .docx (not .doc or .docm)
- [ ] All placeholders use curly braces `{}`
- [ ] Placeholders spelled correctly (case-sensitive)
- [ ] Company logo inserted (if applicable)
- [ ] Headers and footers added (if desired)
- [ ] Tested with sample data
- [ ] Page margins are appropriate
- [ ] Fonts are standard (not exotic)

## Testing Your Template

1. **Save the template**
2. **Restart backend server**
3. **Test with API call:**
   ```bash
   POST /api/mom/generate-pdf-from-template
   {
     "title": "Test Meeting",
     "date": "January 2, 2026",
     "time": "10:00 AM",
     "location": "Test Room",
     "attendees": ["John Doe", "Jane Smith"],
     "rawContent": "This is test content for the meeting.",
     "companyName": "Trimity Consultants"
   }
   ```
4. **Download and check the PDF**
5. **Adjust template as needed**

## Common Mistakes to Avoid

❌ Wrong file name: `Letterhead.docx`, `letter-head.docx`
✅ Correct: `letterhead.docx`

❌ Wrong location: Desktop, Documents folder
✅ Correct: `backend/templates/letterhead.docx`

❌ Wrong format: .doc, .docm, .rtf
✅ Correct: .docx

❌ Wrong brackets: (companyName), [companyName]
✅ Correct: {companyName}

❌ Wrong spelling: {companyname}, {CompanyName}
✅ Correct: {companyName}

## Need Help?

- See `TEMPLATE_CREATION_GUIDE.html` for visual guide
- See `README.md` for detailed instructions
- Check backend console for error messages

## Sample Values for Testing

When testing your template, here's what will appear:

- `{companyName}` → "Trimity Consultants"
- `{documentTitle}` → "MINUTES OF MEETING"
- `{meetingTitle}` → "Project Kickoff Meeting"
- `{meetingDate}` → "January 2, 2026"
- `{meetingTime}` → "10:00 AM"
- `{meetingLocation}` → "Conference Room A"
- `{content}` → Your reframed meeting content
- `{generatedDate}` → "January 2, 2026"

Attendees list will show:
- • John Doe
- • Jane Smith
- • (more attendees)

---

**Ready?** Create your template and place it in `backend/templates/letterhead.docx`!
