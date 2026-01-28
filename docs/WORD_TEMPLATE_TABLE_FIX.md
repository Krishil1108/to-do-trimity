# Word Template Table Setup - Complete Guide

## Problem: Loop Tags Showing as Text

If you see `{#discussionPoints}`, `{srNo}`, `{point}`, `{/discussionPoints}` appearing as **text** in your document instead of creating rows, the loop tags are not properly integrated into the table structure.

## Solution Options

### Option 1: Use Simple Text with Line Breaks (EASIEST - RECOMMENDED)

Instead of using loops, use a single placeholder that contains pre-formatted text:

**In your Word template table:**

```
┌──────────┬────────────────────────────────────┐
│ Sr. No.  │ Point of discussion/ Observation  │
├──────────┼────────────────────────────────────┤
│          │ {formattedPointsText}             │
└──────────┴────────────────────────────────────┘
```

Simply put `{formattedPointsText}` in the Point cell. The backend automatically formats it as:
```
1. First point

2. Second point

3. Third point
```

**Pros:** Simple, works immediately
**Cons:** No separate Sr. No. column

---

### Option 2: Individual Point Variables (SIMPLE)

For templates with fixed number of rows (e.g., 5 rows):

**Template structure:**

```
┌──────────┬────────────────────────────────────┐
│ Sr. No.  │ Point of discussion/ Observation  │
├──────────┼────────────────────────────────────┤
│ {point1Sr}│ {point1Text}                      │
├──────────┼────────────────────────────────────┤
│ {point2Sr}│ {point2Text}                      │
├──────────┼────────────────────────────────────┤
│ {point3Sr}│ {point3Text}                      │
├──────────┼────────────────────────────────────┤
│ {point4Sr}│ {point4Text}                      │
├──────────┼────────────────────────────────────┤
│ {point5Sr}│ {point5Text}                      │
└──────────┴────────────────────────────────────┘
```

Available variables:
- `{point1Sr}`, `{point1Text}`
- `{point2Sr}`, `{point2Text}`
- `{point3Sr}`, `{point3Text}`
- etc.

**Pros:** Separate columns, clean table structure
**Cons:** Fixed number of rows, unused rows will show placeholders

---

### Option 3: Advanced Loop (COMPLEX - For Dynamic Rows)

⚠️ **This requires very specific Word table setup**

#### Step-by-Step Instructions:

1. **Open Word template in Microsoft Word**

2. **Create/locate your table**

3. **CRITICAL: Enable "Show/Hide" formatting marks**
   - Click the ¶ button in Word ribbon
   - This shows hidden paragraph marks

4. **Select the ENTIRE data row**
   - Click in the left margin to select the whole row
   - You should see the row highlighted in blue

5. **Place loop tags VERY carefully:**

   **Option A: In the first cell**
   - Place cursor at the **very start** of the first cell
   - Type: `{#discussionPoints}`
   - Place cursor at the **very end** of the last cell
   - Type: `{/discussionPoints}`

   **Option B: Around the row (preferred)**
   - Place cursor **just before** the first cell (you'll see a ¤ or table marker)
   - Type: `{#discussionPoints}`
   - Place cursor **just after** the last cell (after the row's end marker)
   - Type: `{/discussionPoints}`

6. **Update cell content:**
   - First cell: `{srNo}`
   - Second cell: `{point}`

7. **The table should look like this in "Show/Hide" mode:**

```
{#discussionPoints}
┌──────────┬────────────────────────────────────┐
│ {srNo}   │ {point}                            │¶
└──────────┴────────────────────────────────────┘¶
{/discussionPoints}
```

8. **Save the template**

9. **Test with a document**

#### Common Loop Issues:

**❌ WRONG - Loop as regular text:**
```
{#discussionPoints}
Row: {srNo} | {point}
{/discussionPoints}
```
*Result:* Loop tags appear as text

**❌ WRONG - Loop in wrong place:**
```
┌──────────┬────────────────────────────────────┐
│ {#discussionPoints}{srNo}{/discussionPoints} │ {point} │
└──────────┴────────────────────────────────────┘
```
*Result:* Only first cell repeats

**✅ CORRECT - Loop around entire row:**
```
{#discussionPoints}
┌──────────┬────────────────────────────────────┐
│ {srNo}   │ {point}                            │
└──────────┴────────────────────────────────────┘
{/discussionPoints}
```
*Result:* Entire row repeats for each point

---

## Quick Comparison

| Method | Difficulty | Dynamic Rows | Separate Columns | Best For |
|--------|-----------|--------------|------------------|----------|
| formattedPointsText | ⭐ Easy | ✅ Yes | ❌ No | Quick setup |
| Individual Variables | ⭐⭐ Medium | ❌ No | ✅ Yes | Fixed format |
| Loop | ⭐⭐⭐ Hard | ✅ Yes | ✅ Yes | Advanced users |

---

## Recommendation: Use Option 1 (formattedPointsText)

**Updated template:**

Replace your current setup with this simple approach:

```
┌───────────────────────────────────────────────────┐
│              MINUTES OF MEETING                   │
├───────────────────────────────────────────────────┤
│                                                   │
│  {formattedPointsText}                           │
│                                                   │
└───────────────────────────────────────────────────┘
```

Or if you want to keep the table structure:

```
┌──────────────────────────────────────────────────┐
│  Point of discussion/ Observation                │
├──────────────────────────────────────────────────┤
│                                                  │
│  {formattedPointsText}                          │
│                                                  │
└──────────────────────────────────────────────────┘
```

This will automatically format as:

```
1. The outer plumbing downpipe has been replaced, which does not align with the original drawings.

2. The team has begun internal plumbing work and will contact us for inspection upon completion.
```

**Each point on a new line, properly numbered!**

---

## Testing Your Template

After making changes:

1. **Save the template** as `letterhead.docx`
2. **Upload to** `backend/templates/`
3. **Test with this content:**
   ```
   1. First test point
   2. Second test point
   3. Third test point
   ```
4. **Generate document**
5. **Check the output**

### Expected Results:

✅ Each point appears on its own line
✅ Points are numbered (1., 2., 3.)
✅ No placeholder text showing
✅ Clean, readable format

---

## Available Template Variables

### Content Variables:
- `{content}` - Raw content (all points together)
- `{formattedPointsText}` - **Pre-formatted with line breaks** ⭐ RECOMMENDED
- `{discussionPoints}` - Array for loops (advanced)
- `{point1Text}`, `{point2Text}`, etc. - Individual points
- `{point1Sr}`, `{point2Sr}`, etc. - Individual serial numbers

### Meeting Details:
- `{documentTitle}` - "MINUTES OF MEETING"
- `{meetingTitle}` - Title/subject of meeting
- `{meetingDate}` - Date
- `{meetingTime}` - Time
- `{meetingLocation}` - Location
- `{companyName}` - Company name

### Attendees:
- `{#attendees}{name}{/attendees}` - Loop through attendees

### Images:
- `{%image1}`, `{%image2}`, etc. - Embedded images

---

## Next Steps

1. ✅ **Use `{formattedPointsText}`** in your template (easiest solution)
2. Save and upload the template
3. Test with numbered content
4. Verify output shows each point on separate lines

The backend is already providing all these variables - you just need to update the template placeholders!
