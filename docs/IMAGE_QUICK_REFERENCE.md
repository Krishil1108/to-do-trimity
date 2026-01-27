# Image Support - Quick Reference Card

## 🎨 Image Placeholder Syntax

```
{%imageName}    ← Use this format (with % symbol)
```

## 📏 Size Presets

| Placeholder | Size (W×H) | Use For |
|------------|-----------|---------|
| `{%logo}` | 150×50 | Small logos |
| `{%companyLogo}` | 200×80 | Company branding |
| `{%signature}` | 150×50 | Signatures |
| `{%photo}` | 300×300 | Photos |
| `{%screenshot}` | 500×400 | Screenshots |
| `{%headerImage}` | 600×200 | Headers |
| `{%banner}` | 650×150 | Banners |
| `{%imageN}` | 400×300 | Default |

## 📤 Providing Images

### Method 1: File Path
```json
{
  "images": [
    {
      "name": "logo",
      "data": "uploads/images/company-logo.png"
    }
  ]
}
```

### Method 2: Base64
```json
{
  "images": [
    {
      "name": "logo",
      "data": "data:image/png;base64,iVBORw0KGg..."
    }
  ]
}
```

### Method 3: Simple Array
```json
{
  "images": [
    "uploads/images/photo1.png",
    "uploads/images/photo2.png"
  ]
}
```
Use as: `{%image1}`, `{%image2}`

## ✅ Best Practices

- PNG for logos/transparency
- JPEG for photos
- Optimize before upload (< 1MB)
- Put images on separate lines
- Use descriptive names

## 📂 File Storage

Store images in:
```
backend/uploads/images/
```

## ⚡ Quick Example

**Template:**
```
{%companyLogo}
{companyName}

MINUTES OF MEETING

{content}

Approved:
{%signature}
```

**API Request:**
```json
{
  "companyName": "Trimity",
  "content": "Meeting notes...",
  "images": [
    { "name": "companyLogo", "data": "uploads/images/logo.png" },
    { "name": "signature", "data": "uploads/images/sign.png" }
  ]
}
```

## 🔗 Full Documentation

See: `docs/IMAGE_SUPPORT_DOCUMENTATION.md`
