# MOM Table Rows Setup - Automatic Point Distribution

## Problem
When users write MOM content with numbered points (1, 2, 3...), all content was appearing in the first row of the table instead of each point getting its own row.

## Solution
The backend now automatically parses numbered points and creates a `discussionPoints` array that can be used with Word template loops to create multiple table rows.

## How It Works

### Input (User's MOM Content)
```
1. Discussed project timeline and milestones
2. Reviewed budget allocation for Q1
3. Assigned tasks to team members
4. Scheduled next meeting for Feb 15
```

### Backend Processing
The system automatically parses this into:
```javascript
discussionPoints: [
  { srNo: "1.", point: "Discussed project timeline and milestones" },
  { srNo: "2.", point: "Reviewed budget allocation for Q1" },
  { srNo: "3.", point: "Assigned tasks to team members" },
  { srNo: "4.", point: "Scheduled next meeting for Feb 15" }
]
```

## Word Template Setup

### Current Template Structure (PROBLEM)
```
┌──────────┬────────────────────────────────────┐
│ Sr. No.  │ Point of discussion/ Observation  │
├──────────┼────────────────────────────────────┤
│ 1.       │ {content}                          │ ← All points in ONE row
└──────────┴────────────────────────────────────┘
```

### Updated Template Structure (SOLUTION)
Use a loop to create multiple rows:

```
┌──────────┬────────────────────────────────────┐
│ Sr. No.  │ Point of discussion/ Observation  │
├──────────┼────────────────────────────────────┤
│{#discussionPoints}                            │ ← START LOOP
│ {srNo}   │ {point}                            │ ← Dynamic rows
│{/discussionPoints}                            │ ← END LOOP
└──────────┴────────────────────────────────────┘
```

## Step-by-Step Template Update

### 1. Open Your Word Template
Open `backend/templates/letterhead.docx` in Microsoft Word

### 2. Locate the Table
Find the table with "Point of discussion/Observation" header

### 3. Update the Table Structure

**Replace this:**
```
Row 1: Sr. No. | Point of discussion/ Observation
Row 2: 1.      | {content}
```

**With this:**
```
Row 1: Sr. No. | Point of discussion/ Observation
Row 2: {#discussionPoints}{srNo} | {point}{/discussionPoints}
```

### 4. Detailed Instructions

1. **Select the ENTIRE second row** (the data row, not the header)
2. **Before the first cell content**, add: `{#discussionPoints}`
3. **In the Sr. No. cell**, replace `1.` with: `{srNo}`
4. **In the Point cell**, replace `{content}` with: `{point}`
5. **After the last cell content**, add: `{/discussionPoints}`

### 5. Alternative: Loop Around the Row

If the above doesn't work, try putting the loop OUTSIDE the row:

```
{#discussionPoints}
┌──────────┬────────────────────────────────────┐
│ {srNo}   │ {point}                            │
└──────────┴────────────────────────────────────┘
{/discussionPoints}
```

## Supported Numbering Formats

The parser automatically detects these formats:

✅ `1. Point text`
✅ `1) Point text`
✅ `1: Point text`
✅ `1 - Point text`
✅ Multi-line points (continuation text without numbers)

## Example Output

### Input:
```
1. Reviewed project scope and objectives
2. Discussed resource allocation
Team will be expanded next month
3. Set deadline for March 31
```

### Generated Table:
```
┌────────┬──────────────────────────────────────────────┐
│ Sr.No. │ Point of discussion/ Observation            │
├────────┼──────────────────────────────────────────────┤
│ 1.     │ Reviewed project scope and objectives       │
├────────┼──────────────────────────────────────────────┤
│ 2.     │ Discussed resource allocation Team will be  │
│        │ expanded next month                          │
├────────┼──────────────────────────────────────────────┤
│ 3.     │ Set deadline for March 31                    │
└────────┴──────────────────────────────────────────────┘
```

## Template Variables Available

### For the entire content (single cell):
- `{content}` - All content as-is (old way)

### For looping through points (recommended):
- `{#discussionPoints}...{/discussionPoints}` - Loop through all points
- `{srNo}` - Serial number (1., 2., 3., etc.)
- `{point}` - Point text/description

### Other available variables:
- `{meetingTitle}` - Title of the meeting
- `{meetingDate}` - Date of the meeting
- `{meetingLocation}` - Location
- `{companyName}` - Company name
- `{#attendees}{name}{/attendees}` - List of attendees
- `{%image1}`, `{%image2}`, etc. - Images

## Testing

### Test with backend:
```javascript
// MOM content with numbered points
const testContent = `
1. First discussion point
2. Second discussion point
3. Third discussion point
`;

// This will be parsed into 3 separate rows automatically
```

### Check the logs:
Look for this in the console:
```
📝 [DEBUG] Parsed discussion points: { count: 3, points: [...] }
```

## Fallback Behavior

If no numbered points are detected:
- The entire content is treated as a single point
- Serial number defaults to "1."
- Everything works as before (backward compatible)

## Visual Template Example

Here's what your Word template table should look like:

```
╔════════════════════════════════════════════════════════════╗
║              {documentTitle}                               ║
╠═══════════╤════════════════════════════════════════════════╣
║  Sr. No.  │  Point of discussion/ Observation             ║
╠═══════════╪════════════════════════════════════════════════╣
║{#discussionPoints}                                         ║
║  {srNo}   │  {point}                                       ║
║{/discussionPoints}                                         ║
╚═══════════╧════════════════════════════════════════════════╝
```

## Troubleshooting

### All points still in one row?
- Check that you used `{#discussionPoints}...{/discussionPoints}` loop syntax
- Make sure the loop wraps around the entire table row
- Verify you're using `{point}` not `{content}`

### Points not detected?
- Check numbering format (must start with digit)
- Look at console logs for parsed points
- Verify content has actual numbered items

### Template error when generating?
- Ensure loop tags are properly closed
- Check that `{srNo}` and `{point}` are inside the loop
- Make sure table structure is valid

## Need Help?

Check the backend logs when generating a document to see:
1. How many points were detected
2. What the points contain
3. If the template is receiving the data correctly

The debug output will show:
```
📝 [DEBUG] Parsed discussion points: { count: X, points: [...] }
```
