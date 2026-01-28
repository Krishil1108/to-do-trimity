# Discussion Table Preview - Frontend Integration

## Component Overview

The `DiscussionTablePreview` component shows a live preview of how the discussion points will appear in the generated Word document.

## Installation

The component is already created at:
```
frontend/src/components/DiscussionTablePreview.js
```

## How to Use

### Step 1: Import the Component

In your MOM form component (where users type meeting content):

```javascript
import DiscussionTablePreview from './components/DiscussionTablePreview';
```

### Step 2: Add the Preview Component

Add it below your content textarea:

```javascript
function MOMForm() {
  const [momContent, setMomContent] = useState('');

  return (
    <div>
      {/* Your existing MOM form */}
      <label>Meeting Content:</label>
      <textarea
        value={momContent}
        onChange={(e) => setMomContent(e.target.value)}
        placeholder="Enter discussion points (e.g., 1. First point, 2. Second point)"
        rows={10}
      />

      {/* Add the preview component */}
      <DiscussionTablePreview content={momContent} />

      {/* Rest of your form */}
      <button onClick={generateMOM}>Generate MOM</button>
    </div>
  );
}
```

### Complete Example

```javascript
import React, { useState } from 'react';
import DiscussionTablePreview from './components/DiscussionTablePreview';

function MOMGenerator() {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    location: '',
    content: '',
    attendees: []
  });

  const handleContentChange = (e) => {
    setFormData({
      ...formData,
      content: e.target.value
    });
  };

  const generateDocument = async () => {
    // Your existing generate logic
    const response = await fetch('/api/mom/generate-docx-from-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    // ... handle response
  };

  return (
    <div className="mom-generator">
      <h2>Minutes of Meeting Generator</h2>
      
      <div className="form-group">
        <label>Meeting Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Meeting Content</label>
        <textarea
          value={formData.content}
          onChange={handleContentChange}
          placeholder="Enter numbered points:
1. First discussion point
2. Second discussion point
3. Third discussion point"
          rows={10}
          style={{
            width: '100%',
            padding: '10px',
            fontFamily: 'monospace',
            fontSize: '14px'
          }}
        />
        
        {/* LIVE PREVIEW - Updates as user types */}
        <DiscussionTablePreview content={formData.content} />
      </div>

      <button onClick={generateDocument}>
        📄 Generate Word Document
      </button>
    </div>
  );
}

export default MOMGenerator;
```

## Features

### Auto-Detection
The preview automatically detects these numbering formats:
- `1. Point text`
- `1) Point text`
- `1: Point text`
- `1 - Point text`

### Live Update
The preview updates in real-time as the user types.

### Visual Feedback
Shows:
- ✓ Number of points detected
- ✓ Table with proper borders
- ✓ Alternating row colors for readability
- ✓ Exact layout that will appear in Word

## Preview Examples

### Example 1: Simple Points

**User types:**
```
1. Discussed project timeline
2. Reviewed budget
3. Assigned tasks
```

**Preview shows:**
```
┌──────────┬────────────────────────────────────────────┐
│ Sr. No.  │ Point of discussion/ Observation          │
├──────────┼────────────────────────────────────────────┤
│    1.    │ Discussed project timeline                │
├──────────┼────────────────────────────────────────────┤
│    2.    │ Reviewed budget                           │
├──────────┼────────────────────────────────────────────┤
│    3.    │ Assigned tasks                            │
└──────────┴────────────────────────────────────────────┘
✓ Detected 3 discussion points - Each point will appear in a separate row
```

### Example 2: Multi-line Points

**User types:**
```
1. The outer plumbing downpipe has been replaced, which does not align with the original drawings.
2. The team has begun internal plumbing work and will contact us for inspection upon completion.
```

**Preview shows:**
```
┌──────────┬────────────────────────────────────────────────────────────┐
│ Sr. No.  │ Point of discussion/ Observation                          │
├──────────┼────────────────────────────────────────────────────────────┤
│    1.    │ The outer plumbing downpipe has been replaced, which      │
│          │ does not align with the original drawings.                │
├──────────┼────────────────────────────────────────────────────────────┤
│    2.    │ The team has begun internal plumbing work and will        │
│          │ contact us for inspection upon completion.                │
└──────────┴────────────────────────────────────────────────────────────┘
✓ Detected 2 discussion points - Each point will appear in a separate row
```

## Styling Customization

You can customize the preview appearance by modifying the component styles:

```javascript
// In DiscussionTablePreview.js
<div className="discussion-table-preview" style={{
  marginTop: '20px',
  padding: '15px',
  backgroundColor: '#f9f9f9',  // Change background
  border: '1px solid #ddd',    // Change border
  borderRadius: '8px'           // Change corner radius
}}>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| content | string | Yes | The raw MOM content with numbered points |

## Component Returns

- Returns `null` if no content or no points detected
- Returns a formatted table preview if points are detected

## Benefits

✅ **User Confidence** - Users see exactly what they'll get before generating
✅ **Error Prevention** - Users can verify numbering is detected correctly
✅ **Real-time Feedback** - Live updates as they type
✅ **Professional UI** - Clean, table-based preview matching Word output
✅ **No Extra API Calls** - Parsing happens client-side

## Troubleshooting

### Preview not showing?
- Check that `content` prop is being passed
- Verify content has numbered points (1., 2., etc.)
- Check browser console for errors

### Points not detected?
- Ensure numbering starts with a digit
- Check format: `1.`, `1)`, `1:`, or `1 -`
- Verify each point is on a new line or properly separated

### Styling issues?
- Check that parent container has enough width
- Verify no conflicting CSS styles
- Adjust table styles in component if needed

## Testing

Test the preview with various inputs:

```javascript
// Test 1: Simple numbered list
"1. First point\n2. Second point\n3. Third point"

// Test 2: Different numbering styles
"1) First point\n2) Second point"
"1: First point\n2: Second point"

// Test 3: Multi-line points
"1. This is a very long point that spans multiple lines\nand continues here\n2. Second point"

// Test 4: No numbering
"Just plain text without numbers"
// Should show as single point with "1."
```

## Next Steps

1. Import the component in your MOM form
2. Add it below the content textarea
3. Pass the `content` state variable as prop
4. Test with numbered content
5. Generate document and verify output matches preview

That's it! Your users will now see a live preview of their discussion table before generating the document. 🎉
