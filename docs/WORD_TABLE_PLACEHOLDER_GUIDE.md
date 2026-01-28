# Word Template Setup for Discussion Points Table

## EXACT PLACEHOLDER FOR YOUR LETTERHEAD

### Step 1: Open Your Letterhead Template
Open `backend/templates/letterhead.docx` in Microsoft Word.

### Step 2: Insert Discussion Points Table

Create a **2-column, 2-row table** in Word at the location where you want the discussion points to appear.

#### Table Structure:

```
┌─────────────────┬──────────────────────────────────────────────────┐
│     Sr. No.     │     Point of discussion/ Observation             │
├─────────────────┼──────────────────────────────────────────────────┤
│{#discussionPoints}{srNo}{/discussionPoints}│{#discussionPoints}{point}{/discussionPoints}│
└─────────────────┴──────────────────────────────────────────────────┘
```

### Step 3: Exact Instructions

1. **Insert Table**: Go to Insert → Table → 2 columns × 2 rows

2. **First Row (Header):**
   - Column 1: Type "Sr. No."
   - Column 2: Type "Point of discussion/ Observation"
   - Make this row bold and centered
   - Apply background color (optional: light gray)

3. **Second Row (Template Row):**
   - Column 1: Type EXACTLY: `{#discussionPoints}{srNo}{/discussionPoints}`
   - Column 2: Type EXACTLY: `{#discussionPoints}{point}{/discussionPoints}`

4. **Formatting Tips:**
   - Center-align the Sr. No. column
   - Left-align the Point column
   - Set column widths: Sr. No. = 1 inch, Point = 5-6 inches
   - Add borders to the table (2pt for outer, 1pt for inner)

### Visual Example in Word:

**Row 1 (Header - Bold, Centered):**
```
| Sr. No. | Point of discussion/ Observation |
```

**Row 2 (Template - Contains Loop Syntax):**
```
| {#discussionPoints}{srNo}{/discussionPoints} | {#discussionPoints}{point}{/discussionPoints} |
```

### CRITICAL NOTES:

⚠️ **MUST BE IN A TABLE** - The loop syntax will NOT work in regular paragraphs for tabular data.

⚠️ **SAME ROW REQUIREMENT** - Both `{#discussionPoints}` and `{/discussionPoints}` tags MUST be in the same table row.

⚠️ **NO EXTRA SPACES** - Copy the placeholders exactly as shown, no extra spaces.

⚠️ **CASE SENSITIVE** - Use lowercase: `discussionPoints`, `srNo`, `point`

### How It Works:

When the backend processes your MOM:

**Input from frontend:**
```javascript
discussionPoints: [
  { srNo: "1.", point: "The outer side plumbing downpipe has been changed..." },
  { srNo: "2.", point: "The team has commenced internal plumbing work..." }
]
```

**Result in Word document:**
```
┌──────────┬────────────────────────────────────────────────────────┐
│  Sr. No. │  Point of discussion/ Observation                      │
├──────────┼────────────────────────────────────────────────────────┤
│    1.    │  The outer side plumbing downpipe has been changed...  │
├──────────┼────────────────────────────────────────────────────────┤
│    2.    │  The team has commenced internal plumbing work...      │
└──────────┴────────────────────────────────────────────────────────┘
```

The template row (Row 2) will be **duplicated automatically** for each discussion point in the array!

## Complete Template Example

Here's how your complete letterhead should look:

```
════════════════════════════════════════════════════════
                    TRIMITY CONSULTANTS
                  Minutes of Meeting (MOM)
════════════════════════════════════════════════════════

Title: {title}
Date: {date}
Time: {time}
Location: {location}
Company: {companyName}

Attendees:
{#attendees}
• {.}
{/attendees}

────────────────────────────────────────────────────────

Discussion Points:

┌─────────────┬──────────────────────────────────────────┐
│   Sr. No.   │  Point of discussion/ Observation        │
├─────────────┼──────────────────────────────────────────┤
│{#discussionPoints}{srNo}{/discussionPoints}│{#discussionPoints}{point}{/discussionPoints}│
└─────────────┴──────────────────────────────────────────┘

────────────────────────────────────────────────────────

{#images}
Construction Site Photos:

{%image}
Image: {fileName}

{/images}

════════════════════════════════════════════════════════
                      Page {PAGE} of {NUMPAGES}
```

## Testing Your Template

1. Save the template after adding the table
2. Create a MOM using the tabular format
3. Add 2-3 discussion points
4. Click "Process Text & Generate Preview"
5. Click "Download Word"
6. Open the Word document
7. Verify:
   - ✅ Each discussion point appears in a separate row
   - ✅ Serial numbers are correct (1., 2., 3., etc.)
   - ✅ AI-processed text is included
   - ✅ Table formatting is preserved

## Troubleshooting

**Problem:** All points appear in one cell
**Solution:** Make sure `{#discussionPoints}` and `{/discussionPoints}` are in separate cells of the SAME row

**Problem:** Loop syntax appears as text in document
**Solution:** Check spelling of `discussionPoints` (case-sensitive), ensure it's in a table

**Problem:** Table doesn't expand
**Solution:** Verify the template row contains the loop syntax, not the header row

**Problem:** Empty rows appear
**Solution:** Remove any empty discussion points from the array (backend should filter these)

## Alternative: Simple Paragraph Format

If you prefer a simpler paragraph format instead of a table:

```
Discussion Points:

{#discussionPoints}
{srNo} {point}

{/discussionPoints}
```

This will create:
```
Discussion Points:

1. The outer side plumbing downpipe has been changed...

2. The team has commenced internal plumbing work...
```

However, the **table format is recommended** for professional MOMs as it provides better structure and readability.

---

## Quick Copy-Paste Template

**For Table Cell 1 (Sr. No.):**
```
{#discussionPoints}{srNo}{/discussionPoints}
```

**For Table Cell 2 (Point):**
```
{#discussionPoints}{point}{/discussionPoints}
```

Copy these exactly into your Word table's second row! 🎯
