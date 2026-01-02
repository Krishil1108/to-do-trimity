# Sample Template Text for letterhead.docx

## Copy the content below into your Microsoft Word document

---

**[Insert your company logo here - Use Insert → Pictures]**

---

## TRIMITY CONSULTANTS
**1402-B, Yash Anant, Ashram Road, Ahmedabad, Gujarat**  
**Phone:** +91-XXXXXXXXXX | **Email:** info@trimity.com  
**Website:** www.trimity.com

═══════════════════════════════════════════════════════════════════

<center>

## {documentTitle}

</center>

═══════════════════════════════════════════════════════════════════

### Meeting Information

| Field | Details |
|-------|---------|
| **Project/Task** | {meetingTitle} |
| **Date** | {meetingDate} |
| **Time** | {meetingTime} |
| **Location** | {meetingLocation} |
| **Task ID** | {taskId} |

### Attendees

{#attendees}
• {name}  
{/attendees}

───────────────────────────────────────────────────────────────────

### MEETING NOTES

{content}

═══════════════════════════════════════════════════════════════════

**Document Generated:** {generatedDate}

{documentFooter}

---

**Note:** This is a computer-generated document from {companyName}

<footer style="font-size: 9pt; color: #666;">
Trimity Consultants | Page 1 | Confidential
</footer>

---

## Instructions:

1. Copy all content above (except these instructions)
2. Paste into a new Word document
3. Replace "TRIMITY CONSULTANTS" with your company name
4. Replace address with your address
5. Insert your logo at the top
6. Style the document:
   - Make company name larger and bold
   - Make section headers bold
   - Adjust fonts and colors to match your brand
   - Add borders or design elements as desired
7. Keep all placeholders exactly as shown: {companyName}, {content}, etc.
8. Save as: letterhead.docx
9. Place in: backend/templates/letterhead.docx

## Formatting Tips:

- Company name: 18-24pt, Bold, Your brand color
- Document title: 16pt, Bold, Center
- Section headers: 12-14pt, Bold
- Body text: 11pt, Regular
- Use tables for structured information
- Add horizontal lines to separate sections
- Keep adequate margins (at least 0.75" all sides)

## Testing:

After saving, test with:
```
POST /api/mom/generate-pdf-from-template
{
  "title": "Test Meeting",
  "date": "January 2, 2026",
  "attendees": ["John Doe"],
  "rawContent": "This is a test meeting note."
}
```
