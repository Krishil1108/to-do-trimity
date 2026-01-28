# Image Support Debugging Guide

## Overview
This guide helps you test and debug image support in MOM Word document generation.

## Image Format Requirements

### Frontend: How to Send Images
Images must be sent as an array in the request body:

```javascript
const momData = {
  taskId: "123",
  title: "Meeting Title",
  rawContent: "Meeting content...",
  // Images array - each image should be a base64 string
  images: [
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
  ]
};

// Send to backend
fetch('/api/mom/generate-docx-from-template', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(momData)
});
```

### Word Template: How to Use Placeholders

In your `letterhead.docx` template, use these placeholders:

```
{%image1}    - First image
{%image2}    - Second image
{%image3}    - Third image
etc.
```

**Important:** The placeholder syntax must be exactly `{%imageName}` for the image module to work.

## Testing Steps

### 1. Test Image Endpoint
First, verify the backend can receive and process images:

```bash
# Test with curl (PowerShell)
$testImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

$body = @{
  images = @($testImage)
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/mom/test-image" -Method POST -Body $body -ContentType "application/json"
```

Expected output:
```json
{
  "success": true,
  "message": "Image test completed",
  "data": {
    "received": {
      "count": 1,
      "type": "object",
      "isArray": true
    },
    "processed": {
      "imageKeys": ["image1"],
      "count": 1
    }
  }
}
```

### 2. Check Backend Logs
When testing, watch the console for these debug messages:

```
🖼️  [DEBUG] Request received with images: { imagesProvided: true, ... }
🖼️  [DEBUG] prepareTemplateData - images parameter: { provided: true, ... }
🖼️  [DEBUG] processImages called with: { imageCount: 1, ... }
🖼️  [DEBUG] Processing image 1: { type: 'string', ... }
✅ [DEBUG] Added image1 to template data
🖼️  [DEBUG] Final processed images: ['image1']
📋 [DEBUG] Final template data keys: ['companyName', 'meetingTitle', ..., 'image1']
🖼️  [DEBUG] Image keys in template data: ['image1']
📸 Images in template data: ['image1']
```

### 3. Frontend UI Testing

Add this test button to your frontend MOM form:

```javascript
// Add to your MOM component
const testImageUpload = async () => {
  // Create a tiny 1x1 red pixel PNG
  const testImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
  
  const testData = {
    title: "Image Test MOM",
    rawContent: "This is a test for image support.",
    date: new Date().toLocaleDateString(),
    attendees: ["Test User"],
    images: [testImage]  // Array with one test image
  };
  
  try {
    const response = await fetch('YOUR_API_URL/api/mom/test-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log('✅ Test result:', result);
    alert(`Test passed! Processed ${result.data.processed.count} images`);
  } catch (error) {
    console.error('❌ Test failed:', error);
    alert('Test failed: ' + error.message);
  }
};

// Add test button to UI
<button onClick={testImageUpload}>🧪 Test Image Upload</button>
```

### 4. Generate Test DOCX

Generate a full DOCX with images:

```javascript
const generateTestDocument = async () => {
  const testImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
  
  const momData = {
    title: "Image Test MOM",
    rawContent: "Meeting held to test image functionality.\n\nImage should appear below in the document.",
    date: new Date().toLocaleDateString(),
    location: "Office",
    attendees: ["John Doe", "Jane Smith"],
    companyName: "Test Company",
    images: [testImage]
  };
  
  const response = await fetch('YOUR_API_URL/api/mom/generate-docx-from-template', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(momData)
  });
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'test-mom-with-image.docx';
  a.click();
};
```

## Common Issues & Solutions

### Issue 1: "undefined" appears instead of image

**Cause:** Template placeholder syntax is wrong
**Solution:** Use `{%image1}` not `{image1}` or `{{image1}}`

### Issue 2: Images array not reaching backend

**Cause:** Images not included in request body
**Solution:** Ensure `images: [...]` is in the POST body JSON

### Issue 3: Base64 string too large (413 error)

**Cause:** Request body exceeds size limit
**Solution:** Already fixed - server now accepts up to 50MB

### Issue 4: ImageModule not processing

**Cause:** Module not configured or image data format wrong
**Solution:** Ensure images are base64 strings with `data:image/...` prefix

## Debug Checklist

- [ ] Images array is sent from frontend
- [ ] Backend logs show "images parameter: { provided: true }"
- [ ] Backend logs show "Added image1 to template data"
- [ ] Template uses `{%image1}` syntax
- [ ] Image data is base64 string starting with "data:image/"
- [ ] Request body is under 50MB
- [ ] ImageModule is loaded in route

## Sample Test Images

### Tiny Red Pixel (1x1)
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==
```

### Tiny Blue Pixel (1x1)
```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==
```

Use these for testing without needing actual photos.

## Need Help?

1. Check backend console for 🖼️  emoji debug logs
2. Use `/api/mom/test-image` endpoint to verify image processing
3. Verify Word template has correct `{%image1}` placeholders
4. Ensure images are valid base64 strings with data URI prefix
