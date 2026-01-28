# Correct Word Template Table Structure for Discussion Points

## Problem
When using Docxtemplater with table loops, each **table row** needs to be inside the loop, not individual cells.

## ❌ INCORRECT Structure (What You Currently Have)
```
| Sr. No                                      | Point of discussion/Observation                |
|---------------------------------------------|------------------------------------------------|
| {#discussionPoints}{srNo}{/discussionPoints}| {#discussionPoints}{point}{/discussionPoints} |
```

**Problem:** This creates two separate loops in different cells, causing data to be combined or duplicated.

## ✅ CORRECT Structure (What You Need)

The loop tags should wrap the **entire row**, with the placeholders inside:

```
| Sr. No | Point of discussion/Observation |
|--------|----------------------------------|
| {#discussionPoints}
| {srNo} | {point}                          |
| {/discussionPoints}
```

## Step-by-Step Fix in Microsoft Word

1. **Open** `letterhead.docx` in Microsoft Word

2. **Delete the current template row** (the row with placeholders)

3. **Insert a new row** below the header

4. **In the FIRST cell** of the new row, type:
   ```
   {#discussionPoints}
   {srNo}
   ```

5. **In the SECOND cell** of the same row, type:
   ```
   {point}
   {/discussionPoints}
   ```

6. **Important:** The `{#discussionPoints}` opening tag should be in the first cell, and `{/discussionPoints}` closing tag should be in the last cell of the same row.

## Alternative: Loop Around Entire Row

You can also place the loop tags in a single cell spanning the entire row:

1. **Merge a row** above your template row temporarily
2. In that merged cell, type: `{#discussionPoints}`
3. In the actual data row below, put: `{srNo}` | `{point}`
4. In another merged cell below, type: `{/discussionPoints}`

## Testing Your Template

After fixing, test with this data structure:
```json
{
  "discussionPoints": [
    { "srNo": "1.", "point": "First discussion point" },
    { "srNo": "2.", "point": "Second discussion point" },
    { "srNo": "3.", "point": "Third discussion point" }
  ]
}
```

Expected output:
```
| 1. | First discussion point  |
| 2. | Second discussion point |
| 3. | Third discussion point  |
```

## Common Issues

1. **Both cells show same data:** Loop tags are in wrong positions
2. **Only one row appears:** Loop isn't wrapping the row properly
3. **Data appears in wrong cells:** Opening and closing tags aren't balanced

## Reference
- [Docxtemplater Table Loops](https://docxtemplater.com/docs/tag-types/#loops-in-tables)
- The key principle: **Loops in tables must wrap complete rows**
