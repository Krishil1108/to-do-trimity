# Images Directory

This directory is used to store images for Word template PDF generation.

## Purpose

Store your images here to use them in MOM PDFs with the Word template system.

## Supported Image Formats

- PNG (recommended for logos and images with transparency)
- JPEG/JPG (recommended for photos)
- GIF
- BMP

## Usage

### 1. Add Images to This Directory

Place your images in this folder:
```
backend/uploads/images/
├── company-logo.png
├── ceo-signature.png
├── team-photo.jpg
├── screenshot1.png
└── ... (your images)
```

### 2. Reference in API Requests

```json
{
  "images": [
    {
      "name": "companyLogo",
      "data": "uploads/images/company-logo.png"
    },
    {
      "name": "signature",
      "data": "uploads/images/ceo-signature.png"
    }
  ]
}
```

### 3. Use in Word Template

In your `letterhead.docx` template, add:
```
{%companyLogo}
{%signature}
```

## Recommended Image Sizes

For best results, prepare images at these sizes:

### Logos
- Small logo: 300×100 pixels
- Company logo: 400×160 pixels

### Signatures
- 300×100 pixels

### Photos
- 800×600 pixels or 1200×900 pixels

### Screenshots
- 1280×720 pixels (HD)
- 1920×1080 pixels (Full HD)

### Banners
- 1300×300 pixels

**Note:** Images will be automatically scaled to fit the placeholder size, but starting with appropriate dimensions ensures best quality.

## File Naming Best Practices

Use descriptive, lowercase names with hyphens:
- ✅ `company-logo.png`
- ✅ `ceo-signature.png`
- ✅ `team-photo-2026.jpg`
- ❌ `IMG_001.png`
- ❌ `CompanyLogo.PNG`

## File Size Recommendations

Keep image files optimized:
- Logos: < 100 KB
- Signatures: < 50 KB
- Photos: < 500 KB
- Screenshots: < 1 MB

Large files will increase PDF generation time and file size.

## Image Optimization Tips

1. **Use PNG for logos**: Better quality for graphics with text
2. **Use JPEG for photos**: Better compression for photographs
3. **Compress images**: Use tools like TinyPNG or ImageOptim
4. **Crop unnecessary parts**: Remove whitespace around images
5. **Use appropriate resolution**: 72-150 DPI is sufficient for PDFs

## Example Directory Structure

```
backend/uploads/images/
├── logos/
│   ├── trimity-logo.png
│   └── client-logo.png
├── signatures/
│   ├── john-doe-signature.png
│   ├── jane-smith-signature.png
│   └── ceo-signature.png
├── photos/
│   ├── team-photo-2026.jpg
│   └── office-photo.jpg
└── screenshots/
    ├── dashboard.png
    ├── report.png
    └── timeline.png
```

You can organize into subdirectories and reference them:
```json
{
  "images": [
    {
      "name": "logo",
      "data": "uploads/images/logos/trimity-logo.png"
    }
  ]
}
```

## Security Considerations

- Only upload trusted images
- Do not store sensitive information in image filenames
- Regularly clean up unused images
- Consider access permissions for this directory

## Troubleshooting

### Image not appearing in PDF

1. Check file exists at the specified path
2. Verify file permissions (backend must be able to read)
3. Check image format is supported
4. Try with a different image to isolate the issue

### Image too large/small in PDF

1. Use appropriate placeholder name (see size presets)
2. Resize the actual image file
3. Check the documentation for size presets

### Path not found

- Use paths relative to `backend/` directory
- Or use absolute paths
- Check for typos in path/filename

## Documentation

For complete documentation, see:
- `docs/IMAGE_SUPPORT_DOCUMENTATION.md` - Full image support guide
- `docs/IMAGE_USAGE_EXAMPLES.md` - Practical examples
- `docs/IMAGE_QUICK_REFERENCE.md` - Quick reference card

---

**Ready to use images?** Place your images in this directory and reference them in your API requests!
