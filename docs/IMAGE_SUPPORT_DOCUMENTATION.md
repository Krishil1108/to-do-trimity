# Image Support in Word Template - Complete Guide

## 📋 Overview

You can now add **images** to your Minutes of Meeting (MOM) PDFs! This includes logos, signatures, photos, screenshots, diagrams, and any other images you want to include in your professional documents.

## 🎯 Key Features

- ✅ Support for multiple image formats (PNG, JPG, JPEG, GIF, BMP)
- ✅ Multiple ways to provide images (file paths, base64 strings)
- ✅ Automatic image sizing based on placeholder names
- ✅ Custom size presets (logo, signature, photo, etc.)
- ✅ Easy integration with existing Word templates

## 🚀 Quick Start

### Step 1: Add Image Placeholders to Your Word Template

In your `letterhead.docx` template, add image placeholders where you want images to appear:

```
{%logo}              ← Company logo
{%signature}         ← Signature image
{%photo}             ← Photo
{%screenshot}        ← Screenshot
{%companyLogo}       ← Header logo
{%image1}            ← Generic image 1
{%image2}            ← Generic image 2
```

**Important:** Image placeholders use `{%imageName}` syntax (with percentage sign), not regular `{imageName}`.

### Step 2: Provide Images in Your API Request

```javascript
// Example: Using file paths
{
  "taskId": "task123",
  "title": "Project Kickoff Meeting",
  "date": "January 27, 2026",
  "attendees": ["John Doe", "Jane Smith"],
  "rawContent": "Meeting discussion...",
  "companyName": "Trimity Consultants",
  "images": [
    {
      "name": "logo",
      "data": "uploads/images/company-logo.png"
    },
    {
      "name": "signature",
      "data": "uploads/images/ceo-signature.png"
    }
  ]
}
```

```javascript
// Example: Using base64 strings
{
  "taskId": "task123",
  "title": "Project Kickoff Meeting",
  "images": [
    {
      "name": "logo",
      "data": "data:image/png;base64,iVBORw0KGgoAAAANS..."
    },
    {
      "name": "photo",
      "data": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD..."
    }
  ]
}
```

## 📝 Image Placeholder Reference

### Available Placeholder Types

| Placeholder | Size (Width x Height) | Best For |
|------------|----------------------|----------|
| `{%logo}` | 150 x 50 pixels | Small logo in header/footer |
| `{%companyLogo}` | 200 x 80 pixels | Company branding |
| `{%headerImage}` | 600 x 200 pixels | Header/banner images |
| `{%signature}` | 150 x 50 pixels | Digital signatures |
| `{%photo}` | 300 x 300 pixels | Profile photos, team photos |
| `{%screenshot}` | 500 x 400 pixels | Screen captures, diagrams |
| `{%banner}` | 650 x 150 pixels | Wide banner images |
| `{%image1}`, `{%image2}`, etc. | 400 x 300 pixels | Generic images (default size) |

**Note:** Sizes are automatically applied based on the placeholder name. The actual image will be scaled proportionally to fit these dimensions.

## 🎨 Creating Your Template with Images

### Example 1: Company Letterhead with Logo

```
┌─────────────────────────────────────────────────────┐
│  {%companyLogo}          {companyName}              │
│                          Corporate Office           │
│                          Address Line               │
├─────────────────────────────────────────────────────┤
│                                                     │
│            MINUTES OF MEETING                       │
│                                                     │
│  Meeting Title: {meetingTitle}                      │
│  Date: {meetingDate}                                │
│  Location: {meetingLocation}                        │
│                                                     │
│  ATTENDEES:                                         │
│  {#attendees}                                       │
│    • {name}                                         │
│  {/attendees}                                       │
│                                                     │
│  MEETING NOTES:                                     │
│  {content}                                          │
│                                                     │
│  {%screenshot}                                      │
│  ↑ Add screenshots or diagrams in content          │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Prepared by: {preparedBy}                          │
│  Signature: {%signature}                            │
│  Date: {generatedDate}                              │
└─────────────────────────────────────────────────────┘
```

### Example 2: Multiple Images in Content

```
MEETING SUMMARY
{content}

PROJECT SCREENSHOTS:
{%screenshot}

TEAM PHOTO:
{%photo}

ADDITIONAL IMAGES:
{%image1}
{%image2}
```

## 📤 How to Provide Images

### Method 1: File Paths (Recommended)

Store images in `backend/uploads/images/` directory and reference them by path:

```javascript
{
  "images": [
    {
      "name": "logo",
      "data": "uploads/images/company-logo.png"
    },
    {
      "name": "signature", 
      "data": "uploads/images/john-signature.png"
    }
  ]
}
```

**Supported paths:**
- Relative to backend directory: `uploads/images/logo.png`
- Absolute paths: `C:/Users/images/logo.png`

### Method 2: Base64 Encoded Strings

Encode images as base64 and send them directly:

```javascript
{
  "images": [
    {
      "name": "logo",
      "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    }
  ]
}
```

**Note:** Base64 strings can be with or without the `data:image/...;base64,` prefix.

### Method 3: Simple Array (Auto-numbered)

Provide just paths, and they'll be named `image1`, `image2`, etc.:

```javascript
{
  "images": [
    "uploads/images/photo1.png",
    "uploads/images/photo2.png"
  ]
}
```

Then use `{%image1}` and `{%image2}` in your template.

## 🔧 Complete API Example

```javascript
POST /api/mom/generate-pdf-from-template

{
  "taskId": "TASK-2026-001",
  "title": "Q1 Planning Meeting",
  "date": "January 27, 2026",
  "time": "10:00 AM",
  "location": "Conference Room A",
  "attendees": [
    "John Doe - CEO",
    "Jane Smith - CTO",
    "Bob Johnson - CFO"
  ],
  "rawContent": "Discussed Q1 goals and objectives. Key decisions made regarding budget allocation and team expansion.",
  "companyName": "Trimity Consultants",
  "images": [
    {
      "name": "companyLogo",
      "data": "uploads/images/trimity-logo.png"
    },
    {
      "name": "signature",
      "data": "uploads/images/ceo-signature.png"
    },
    {
      "name": "screenshot",
      "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
    }
  ]
}
```

## 📂 Directory Structure

```
backend/
├── services/
│   └── wordTemplatePdfService.js  ← Image support implemented here
├── templates/
│   └── letterhead.docx            ← Your template with {%imageName} placeholders
├── uploads/
│   └── images/                    ← Store your images here
│       ├── company-logo.png
│       ├── signature.png
│       ├── banner.jpg
│       └── ... (your images)
└── temp/
    └── ... (temporary files)
```

## ✅ Best Practices

### Image Files
1. **Use PNG format** for logos and images with transparency
2. **Use JPEG** for photos and complex images
3. **Optimize image sizes** before uploading (don't use 10MB images for logos!)
4. **Recommended dimensions:**
   - Logos: 300x100px to 400x150px
   - Signatures: 300x100px
   - Photos: 800x600px to 1200x900px
   - Screenshots: 1280x720px to 1920x1080px

### Template Design
1. **Place images on their own line** in the template
2. **Don't put images inside text paragraphs** (may cause formatting issues)
3. **Test with sample images first** before production use
4. **Use descriptive placeholder names** (e.g., `ceoSignature`, `companyLogo`)

### API Requests
1. **For logos/signatures:** Store files and use file paths
2. **For dynamic content:** Use base64 encoding
3. **Validate images exist** before sending requests
4. **Handle missing images gracefully** (empty buffer returned if not found)

## 🐛 Troubleshooting

### Problem: Image doesn't appear in PDF

**Solutions:**
1. Check placeholder syntax: Must be `{%imageName}` not `{imageName}`
2. Verify image file exists at the specified path
3. Check file permissions (backend must be able to read the file)
4. Ensure image format is supported (PNG, JPG, JPEG, GIF, BMP)
5. Try with base64 string to rule out path issues

### Problem: Image is too large/small

**Solutions:**
1. Use a different placeholder name (e.g., `logo` for smaller, `banner` for wider)
2. Resize the actual image file before uploading
3. Check the size presets in the documentation

### Problem: "Image not found" error

**Solutions:**
1. Verify the path is correct (relative to backend directory)
2. Create the `backend/uploads/images/` directory if it doesn't exist
3. Use absolute path as a test
4. Check file name spelling and case sensitivity

### Problem: Base64 image not working

**Solutions:**
1. Ensure base64 string is valid
2. Try with and without the `data:image/...;base64,` prefix
3. Verify the base64 encoding is correct (test on base64decode.org)

## 🎓 Advanced Usage

### Dynamic Image Selection

```javascript
// Select signature based on who prepared the document
const preparedBy = "John Doe";
const signatures = {
  "John Doe": "uploads/images/john-signature.png",
  "Jane Smith": "uploads/images/jane-signature.png",
};

{
  "images": [
    {
      "name": "signature",
      "data": signatures[preparedBy]
    }
  ]
}
```

### Multiple Images for Gallery

```javascript
{
  "images": [
    { "name": "photo1", "data": "uploads/images/meeting1.jpg" },
    { "name": "photo2", "data": "uploads/images/meeting2.jpg" },
    { "name": "photo3", "data": "uploads/images/meeting3.jpg" },
    { "name": "photo4", "data": "uploads/images/meeting4.jpg" }
  ]
}
```

Template:
```
MEETING PHOTOS:

{%photo1}  {%photo2}

{%photo3}  {%photo4}
```

### Conditional Images

```javascript
// Include signature only if meeting is finalized
const includeSignature = meetingStatus === "finalized";

{
  "images": includeSignature ? [
    { "name": "signature", "data": "uploads/images/signature.png" }
  ] : []
}
```

## 📚 Related Documentation

- [Word Template Quick Start](./WORD_TEMPLATE_QUICKSTART.md) - Basic template setup
- [Word Template Documentation](./WORD_TEMPLATE_DOCUMENTATION.md) - Complete template guide
- [MOM System](./MOM_SYSTEM.md) - Overall MOM system documentation

## 🆘 Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify all paths and file names
3. Test with a simple image first (small PNG file)
4. Review the examples in this documentation
5. Check that `docxtemplater-image-module-free` is installed

---

**Happy templating! 🎉** Your MOM PDFs will now look even more professional with images!
