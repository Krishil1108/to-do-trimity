# 🎨 Image Support - Visual Quick Guide

## 📸 Before vs After

### BEFORE (Text Only):
```
┌─────────────────────────────────────┐
│  TRIMITY CONSULTANTS                │
│  123 Business Street                │
│  contact@trimity.com                │
├─────────────────────────────────────┤
│  MINUTES OF MEETING                 │
│  Project: Q1 Planning               │
│  Date: Jan 27, 2026                 │
└─────────────────────────────────────┘
```

### AFTER (With Images):
```
┌─────────────────────────────────────┐
│  [LOGO IMAGE]  TRIMITY CONSULTANTS  │
│                123 Business Street  │
│                contact@trimity.com  │
├─────────────────────────────────────┤
│  MINUTES OF MEETING                 │
│  Project: Q1 Planning               │
│  Date: Jan 27, 2026                 │
│                                     │
│  [MEETING PHOTO]                    │
│                                     │
│  Meeting Notes...                   │
│                                     │
│  [SCREENSHOT]                       │
│                                     │
│  Approved:                          │
│  [SIGNATURE IMAGE]                  │
└─────────────────────────────────────┘
```

## 🔄 How It Works

```
┌─────────────────┐
│  1. TEMPLATE    │
│  letterhead.docx│
│                 │
│  {%logo}        │ ◄─── Image placeholder
│  {companyName}  │
│  {content}      │
│  {%signature}   │ ◄─── Image placeholder
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. API REQUEST │
│                 │
│  images: [      │
│    {            │
│      name: "logo",
│      data: "path/to/logo.png"
│    },           │
│    {            │
│      name: "signature",
│      data: "base64..."
│    }            │
│  ]              │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. PROCESSING  │
│                 │
│  • Load images  │
│  • Determine    │
│    size         │
│  • Insert into  │
│    template     │
│  • Generate PDF │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. OUTPUT      │
│  MOM_xxx.pdf    │
│                 │
│  With images    │
│  embedded! 🎉   │
└─────────────────┘
```

## 🎯 Placeholder Syntax

### ❌ WRONG:
```
{logo}              ← Missing % symbol
{#logo}             ← Wrong symbol
<%logo%>            ← Wrong format
[logo]              ← Wrong brackets
```

### ✅ CORRECT:
```
{%logo}             ← Perfect!
{%companyLogo}      ← Perfect!
{%signature}        ← Perfect!
```

## 📏 Size Visual Guide

```
{%logo}
┌──────────────┐
│   150 x 50   │  ← Small logo
└──────────────┘

{%companyLogo}
┌─────────────────────┐
│     200 x 80        │  ← Company branding
└─────────────────────┘

{%signature}
┌──────────────┐
│   150 x 50   │  ← Digital signature
└──────────────┘

{%photo}
┌─────────────────┐
│                 │
│   300 x 300     │  ← Square photo
│                 │
└─────────────────┘

{%screenshot}
┌────────────────────────┐
│                        │
│     500 x 400          │  ← Screenshot
│                        │
└────────────────────────┘

{%headerImage}
┌──────────────────────────────────────┐
│          600 x 200                   │  ← Header banner
└──────────────────────────────────────┘

{%banner}
┌─────────────────────────────────────────────┐
│              650 x 150                      │  ← Wide banner
└─────────────────────────────────────────────┘

{%image1}
┌──────────────────────┐
│                      │
│     400 x 300        │  ← Default size
│                      │
└──────────────────────┘
```

## 🔌 API Request Visual

```json
{
  "taskId": "task123",
  "title": "Meeting",
  "rawContent": "...",
  
  "images": [              ◄─── NEW SECTION!
    {
      "name": "logo",      ◄─── Matches {%logo}
      "data": "uploads/images/logo.png"
    },                              ↑
    {                               │
      "name": "signature", ◄────────┼─── Matches {%signature}
      "data": "uploads/images/sig.png"
    }                               ↓
  ]                        ◄─── 📁 File paths OR
                                💾 Base64 strings
}
```

## 📂 File Organization

```
backend/
├── templates/
│   └── letterhead.docx          ◄─── Your template
│                                     Contains: {%logo}
│
├── uploads/
│   └── images/                  ◄─── Your images folder
│       ├── logo.png            ◄─── Referenced in API
│       ├── signature.png       ◄─── Referenced in API
│       └── banner.jpg          ◄─── Referenced in API
│
└── services/
    └── wordTemplatePdfService.js ◄─── Image support code
```

## 🎨 Complete Example

### 1️⃣ Template (letterhead.docx):
```
{%companyLogo}

{companyName}
Corporate Headquarters

MINUTES OF MEETING

Title: {meetingTitle}
Date: {meetingDate}

MEETING NOTES:
{content}

SCREENSHOTS:
{%screenshot}

APPROVED BY:
{%signature}
CEO Signature
```

### 2️⃣ API Request:
```json
{
  "companyName": "Trimity Consultants",
  "meetingTitle": "Q1 Planning",
  "meetingDate": "January 27, 2026",
  "content": "Discussed goals...",
  "images": [
    {
      "name": "companyLogo",
      "data": "uploads/images/trimity-logo.png"
    },
    {
      "name": "screenshot",
      "data": "uploads/images/dashboard.png"
    },
    {
      "name": "signature",
      "data": "uploads/images/ceo-signature.png"
    }
  ]
}
```

### 3️⃣ Result (PDF):
```
┌─────────────────────────────────────┐
│  [TRIMITY LOGO]                     │
│                                     │
│  Trimity Consultants                │
│  Corporate Headquarters             │
├─────────────────────────────────────┤
│  MINUTES OF MEETING                 │
│                                     │
│  Title: Q1 Planning                 │
│  Date: January 27, 2026             │
│                                     │
│  MEETING NOTES:                     │
│  Discussed goals...                 │
│                                     │
│  SCREENSHOTS:                       │
│  [DASHBOARD SCREENSHOT]             │
│                                     │
│  APPROVED BY:                       │
│  [CEO SIGNATURE]                    │
│  CEO Signature                      │
└─────────────────────────────────────┘
```

## ⚡ Quick Copy-Paste Examples

### Logo in Header:
```
Template: {%companyLogo}
API:      { "name": "companyLogo", "data": "uploads/images/logo.png" }
```

### Signature in Footer:
```
Template: {%signature}
API:      { "name": "signature", "data": "uploads/images/sign.png" }
```

### Screenshot in Content:
```
Template: {%screenshot}
API:      { "name": "screenshot", "data": "uploads/images/screen.png" }
```

### Multiple Images:
```
Template: 
  {%image1}
  {%image2}
  {%image3}

API:      
  { "name": "image1", "data": "uploads/images/pic1.jpg" },
  { "name": "image2", "data": "uploads/images/pic2.jpg" },
  { "name": "image3", "data": "uploads/images/pic3.jpg" }
```

## 📚 More Info

- 📖 Full Guide: `IMAGE_SUPPORT_DOCUMENTATION.md`
- 📝 Examples: `IMAGE_USAGE_EXAMPLES.md`
- ⚡ Quick Ref: `IMAGE_QUICK_REFERENCE.md`

---

**Remember:** Image placeholders use `{%imageName}` with the `%` symbol! 🎨
