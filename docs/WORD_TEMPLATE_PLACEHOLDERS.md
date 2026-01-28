# Word Template Placeholders for MOM

## Overview
This document provides the exact placeholders you need to add to your Word template (`letterhead.docx`) to properly display the MOM (Minutes of Meeting) content.

## Template Structure

### 1. Meeting Metadata Section
Add these placeholders at the top of your document for meeting information:

```
Title: {title}
Date: {date}
Time: {time}
Location: {location}
Company: {companyName}
```

### 2. Attendees Section
For the attendees list, use a loop:

```
Attendees:
{#attendees}
• {.}
{/attendees}
```

**Note:** The `{.}` syntax means "current item" in the array.

### 3. Discussion Points Table (CRITICAL)

This is the main content section. You need to create a **table in Word** with the following structure:

**Step-by-step instructions:**

1. **Insert a table** with 2 columns in Word
2. **First row (Header row):**
   - Cell 1: "Sr. No."
   - Cell 2: "Point of discussion/ Observation"

3. **Second row (Template row):**
   - Cell 1: `{#discussionPoints}{srNo}{/discussionPoints}`
   - Cell 2: `{#discussionPoints}{point}{/discussionPoints}`

**Visual representation:**

```
┌─────────────┬──────────────────────────────────────────┐
│   Sr. No.   │  Point of discussion/ Observation        │
├─────────────┼──────────────────────────────────────────┤
│{#discussionPoints}{srNo}{/discussionPoints}│{#discussionPoints}{point}{/discussionPoints}│
└─────────────┴──────────────────────────────────────────┘
```

**IMPORTANT:** 
- The `{#discussionPoints}` and `{/discussionPoints}` tags MUST be in the **same table row**
- Each cell contains the full loop tags
- The backend will automatically duplicate this row for each discussion point

### 4. Images Section (Optional)

If you want to include images in the template, add this section:

```
Construction Site Images:

{#images}
{%image}
Image {index}: {fileName}
{/images}
```

**Note:** The `{%image}` is a special placeholder that will be replaced with the actual image.

## Complete Template Example

Here's a complete example of how your Word document should look:

```
═══════════════════════════════════════════════════════════
                    TRIMITY CONSULTANTS
                 Minutes of Meeting (MOM)
═══════════════════════════════════════════════════════════

Title: {title}
Date: {date}
Time: {time}
Location: {location}

Attendees:
{#attendees}
• {.}
{/attendees}

─────────────────────────────────────────────────────────

Discussion Points:

┌─────────────┬──────────────────────────────────────────┐
│   Sr. No.   │  Point of discussion/ Observation        │
├─────────────┼──────────────────────────────────────────┤
│{#discussionPoints}{srNo}{/discussionPoints}│{#discussionPoints}{point}{/discussionPoints}│
└─────────────┴──────────────────────────────────────────┘

─────────────────────────────────────────────────────────

{#images}
Construction Site Photos:

{%image}
Image: {fileName}

{/images}

═══════════════════════════════════════════════════════════
```

## Available Data Variables

The backend provides these variables to the template:

### Metadata
- `{title}` - Meeting title
- `{date}` - Meeting date
- `{time}` - Meeting time
- `{location}` - Meeting location
- `{companyName}` - Company name (default: "Trimity Consultants")

### Attendees (Array)
- `{#attendees}{.}{/attendees}` - List of attendee names

### Discussion Points (Array)
Each discussion point object contains:
- `{srNo}` - Serial number (e.g., "1.", "2.", "3.")
- `{point}` - The discussion point text

### Images (Array) - Optional
Each image object contains:
- `{%image}` - The actual image
- `{fileName}` - Original file name
- `{index}` - Image index (0-based)

## Parsing Logic

The backend automatically parses numbered points from the meeting notes:

**Supported formats:**
- `1. Discussion point` → Recognized
- `1) Discussion point` → Recognized
- `1: Discussion point` → Recognized
- `1- Discussion point` → Recognized

**Example input:**
```
1. The outer side plumbing downpipe has been changed
2. Team has commenced internal plumbing work
3. Inspection scheduled for next week
```

**Will be parsed as:**
```javascript
[
  { srNo: "1.", point: "The outer side plumbing downpipe has been changed" },
  { srNo: "2.", point: "Team has commenced internal plumbing work" },
  { srNo: "3.", point: "Inspection scheduled for next week" }
]
```

## How the Preview Matches the Document

The frontend preview component uses **exactly the same parsing logic** as the backend, so what you see in the preview is **exactly** what will appear in the Word document.

### Preview Flow:
1. User writes meeting notes
2. User uploads images (optional)
3. User clicks "Generate Preview"
4. Preview shows:
   - Meeting metadata
   - Discussion points table (exactly as it will appear)
   - Images (exactly as they will appear)
5. User clicks "Download Word Document"
6. Word document is generated with exact same content

## Testing Your Template

1. Open your `letterhead.docx` file
2. Add the placeholders as shown above
3. Make sure the discussion points table has the loop syntax in **the same row**
4. Save the template
5. Test by creating a MOM with numbered points
6. Check that each numbered point appears in a separate table row

## Troubleshooting

**Problem:** All discussion points appear in one row
**Solution:** Make sure `{#discussionPoints}` and `{/discussionPoints}` are in the SAME table row

**Problem:** Loop syntax appears as literal text in document
**Solution:** The table syntax must be correct. Each cell should contain the full loop with the variable inside.

**Problem:** Images not showing
**Solution:** Make sure you're using `{%image}` placeholder (with % sign, not # sign)

## Notes

- The template uses **Docxtemplater** syntax
- Tables automatically expand based on array length
- Images are processed as base64 data
- All text can be in Gujarati or English (will be processed by AI)

