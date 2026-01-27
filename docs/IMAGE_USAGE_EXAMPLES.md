# Image Usage Examples for Word Templates

This file contains practical examples of how to use images in your Word templates.

## Example 1: Simple Company Logo in Header

### Template Content:
```
{%companyLogo}

{companyName}
Corporate Headquarters
123 Business Street, City, State 12345
Email: info@company.com | Phone: (555) 123-4567

═══════════════════════════════════════════════════════
```

### API Request:
```json
{
  "companyName": "Trimity Consultants",
  "images": [
    {
      "name": "companyLogo",
      "data": "uploads/images/trimity-logo.png"
    }
  ]
}
```

---

## Example 2: Letterhead with Logo and Signature

### Template Content:
```
┌─────────────────────────────────────────────────────┐
│  {%logo}                                            │
│  {companyName}                                      │
│  Official Communication                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│            MINUTES OF MEETING                       │
│                                                     │
│  Title: {meetingTitle}                              │
│  Date: {meetingDate}                                │
│                                                     │
│  {content}                                          │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Approved by:                                       │
│  {%signature}                                       │
│  John Doe, CEO                                      │
│  {generatedDate}                                    │
└─────────────────────────────────────────────────────┘
```

### API Request:
```json
{
  "companyName": "Trimity Consultants",
  "meetingTitle": "Q1 Planning Meeting",
  "meetingDate": "January 27, 2026",
  "content": "Meeting discussion...",
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

---

## Example 3: Meeting Report with Screenshots

### Template Content:
```
{companyName}
MEETING REPORT

Meeting: {meetingTitle}
Date: {meetingDate}

DISCUSSION SUMMARY:
{content}

SCREENSHOTS & DIAGRAMS:

Figure 1: Project Dashboard
{%screenshot}

Figure 2: Timeline View
{%image1}

Figure 3: Team Structure
{%image2}
```

### API Request:
```json
{
  "images": [
    {
      "name": "screenshot",
      "data": "uploads/images/dashboard-screenshot.png"
    },
    {
      "name": "image1",
      "data": "uploads/images/timeline.png"
    },
    {
      "name": "image2",
      "data": "uploads/images/team-structure.png"
    }
  ]
}
```

---

## Example 4: Using Base64 Encoded Images

### API Request with Base64:
```json
{
  "images": [
    {
      "name": "logo",
      "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA..."
    },
    {
      "name": "signature",
      "data": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAIBAQEBAQIB..."
    }
  ]
}
```

---

## Example 5: Team Meeting with Photos

### Template Content:
```
{companyName}
TEAM MEETING MINUTES

Meeting Title: {meetingTitle}
Date: {meetingDate}
Location: {meetingLocation}

ATTENDEES:
{#attendees}
• {name}
{/attendees}

TEAM PHOTO:
{%photo}

MEETING NOTES:
{content}

PROJECT SCREENSHOTS:
{%screenshot}

PREPARED BY:
{preparedBy}
{%signature}
```

### API Request:
```json
{
  "images": [
    {
      "name": "photo",
      "data": "uploads/images/team-photo.jpg"
    },
    {
      "name": "screenshot",
      "data": "uploads/images/project-board.png"
    },
    {
      "name": "signature",
      "data": "uploads/images/manager-signature.png"
    }
  ]
}
```

---

## Example 6: Professional Header with Banner

### Template Content:
```
{%banner}

═══════════════════════════════════════════════════════

{documentTitle}

{meetingTitle}
{meetingDate} | {meetingTime} | {meetingLocation}

MEETING CONTENT:
{content}

═══════════════════════════════════════════════════════
{companyName} - Confidential Document
Generated: {generatedDate}
```

### API Request:
```json
{
  "images": [
    {
      "name": "banner",
      "data": "uploads/images/company-banner.png"
    }
  ]
}
```

---

## Example 7: Multiple Image Gallery

### Template Content:
```
{companyName}
PROJECT SHOWCASE

Project: {meetingTitle}
Date: {meetingDate}

PROJECT OVERVIEW:
{content}

PROJECT GALLERY:

Screenshot 1:          Screenshot 2:
{%image1}              {%image2}

Screenshot 3:          Screenshot 4:
{%image3}              {%image4}
```

### API Request:
```json
{
  "images": [
    { "name": "image1", "data": "uploads/images/screen1.png" },
    { "name": "image2", "data": "uploads/images/screen2.png" },
    { "name": "image3", "data": "uploads/images/screen3.png" },
    { "name": "image4", "data": "uploads/images/screen4.png" }
  ]
}
```

---

## Tips for Best Results

1. **Image Placement**: Put images on their own lines in the template
2. **Image Names**: Use descriptive names that match the size presets
3. **File Formats**: PNG for logos/transparency, JPEG for photos
4. **File Sizes**: Optimize images before uploading (< 1MB recommended)
5. **Aspect Ratio**: Images are scaled to fit, maintaining aspect ratio

## Size Reference

- `{%logo}` → 150x50px (small logo)
- `{%companyLogo}` → 200x80px (company branding)
- `{%signature}` → 150x50px (signatures)
- `{%photo}` → 300x300px (photos)
- `{%screenshot}` → 500x400px (screenshots)
- `{%headerImage}` → 600x200px (header images)
- `{%banner}` → 650x150px (wide banners)
- `{%image1}` → 400x300px (default size)

---

**For complete documentation, see:** `docs/IMAGE_SUPPORT_DOCUMENTATION.md`
