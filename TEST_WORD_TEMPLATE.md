# Test Your Word Template PDF System

## Quick Test Script

Use this to test if your Word template PDF generation is working correctly.

### Option 1: Test with curl (Windows PowerShell)

```powershell
# Test Word Template PDF Generation
$body = @{
    taskId = "test123"
    title = "Test Meeting"
    date = "January 2, 2026"
    time = "10:00 AM"
    location = "Conference Room A"
    attendees = @("John Doe", "Jane Smith", "Bob Wilson")
    rawContent = "આજે આપણે પ્રોજેક્ટની સ્થિતિ વિષે ચર્ચા કરી. બધા સહમત છે કે આગામી અઠવાડિયામાં કામ પૂર્ણ થશે. નવા ફીચર્સ ઉમેરવાની જરૂર છે."
    companyName = "Trimity Consultants"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/mom/generate-pdf-from-template" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body `
    -OutFile "test_mom.pdf"

Write-Host "✅ PDF downloaded as test_mom.pdf"
```

### Option 2: Test with JavaScript (Browser Console)

Open your app in browser, then run in console:

```javascript
// Test API endpoint
fetch('http://localhost:5000/api/mom/generate-pdf-from-template', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    taskId: 'test123',
    title: 'Test Meeting',
    date: 'January 2, 2026',
    time: '10:00 AM',
    location: 'Conference Room A',
    attendees: ['John Doe', 'Jane Smith'],
    rawContent: 'Today we discussed project status. All team members agreed on next steps.',
    companyName: 'Trimity Consultants'
  })
})
.then(response => response.blob())
.then(blob => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'test_mom.pdf';
  a.click();
  console.log('✅ PDF downloaded!');
})
.catch(err => console.error('❌ Error:', err));
```

### Option 3: Test through Frontend UI

1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm start`
3. Login to app
4. Go to any task
5. Click "Generate MOM"
6. Enter test content:
   ```
   Today we discussed the project timeline. The team agreed that we need 
   to complete the first phase by next week. John will handle the frontend, 
   Jane will work on backend, and Bob will manage testing.
   ```
7. Click "Process Text" (wait for AI reframing)
8. Click "Download PDF (Letterhead)"
9. Check downloaded PDF!

## What to Check in Generated PDF

### ✅ Your Template Should Show:
- [ ] Your company logo (if in template)
- [ ] Company name and address
- [ ] "MINUTES OF MEETING" title
- [ ] Meeting title: "Test Meeting"
- [ ] Date: "January 2, 2026"
- [ ] Time: "10:00 AM"
- [ ] Location: "Conference Room A"
- [ ] Attendees list:
  - John Doe
  - Jane Smith
  - Bob Wilson (if 3 provided)
- [ ] **Reframed/processed content** (professional language)
- [ ] Generation date
- [ ] Footer information

### ✅ Content Should Be:
- [ ] Translated to English (if Gujarati input)
- [ ] Grammatically correct
- [ ] Professional tone
- [ ] Well-structured
- [ ] Complete sentences

## Expected Results

### If Template Found:
```
✅ PDF downloaded successfully with your letterhead!
✅ MOM saved to history
```

### If Template Not Found (Fallback):
```
⚠️ Word template not found. Using default PDF generation...
📄 PDF downloaded using default template!
```

### If Error:
```
❌ Failed to generate PDF: [error message]
```

## Troubleshooting Test

### Test 1: Check Template Exists
```powershell
Test-Path "backend/templates/letterhead.docx"
# Should return: True
```

### Test 2: Check Backend Running
```powershell
curl http://localhost:5000/api/mom/test
# Should return: {"success": true, ...}
```

### Test 3: Check Template Service
```powershell
# Check if service file exists
Test-Path "backend/services/wordTemplatePdfService.js"
# Should return: True
```

### Test 4: Check Node Modules
```powershell
cd backend
npm list docxtemplater pizzip docx-pdf
# Should show installed packages
```

## Performance Test

Time each step:

1. **API Call Start** → Note time
2. **Response Received** → Calculate duration
3. **Expected:** 3-10 seconds total
   - Text processing: 2-5 seconds
   - Template processing: 0.5 seconds
   - PDF conversion: 1-3 seconds

## Stress Test (Optional)

Test with multiple requests:

```javascript
// Generate 5 MOMs in sequence
for (let i = 1; i <= 5; i++) {
  setTimeout(() => {
    fetch('http://localhost:5000/api/mom/generate-pdf-from-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Test Meeting ${i}`,
        date: 'January 2, 2026',
        attendees: ['Test User'],
        rawContent: `This is test content for meeting number ${i}.`,
      })
    })
    .then(r => r.blob())
    .then(() => console.log(`✅ PDF ${i} generated`))
    .catch(err => console.error(`❌ PDF ${i} failed:`, err));
  }, i * 10000); // 10 seconds apart
}
```

## Integration Test Checklist

- [ ] Backend starts without errors
- [ ] Template file detected on startup
- [ ] API endpoints respond correctly
- [ ] Frontend loads MOM modal
- [ ] "Download PDF (Letterhead)" button appears
- [ ] Text processing works (AI reframing)
- [ ] PDF generates successfully
- [ ] PDF downloads to browser
- [ ] PDF opens correctly
- [ ] Content is properly formatted
- [ ] Template design is preserved
- [ ] Fallback works if template missing
- [ ] MOM saves to history
- [ ] Can regenerate from history
- [ ] Error messages are clear

## Test Results Log

Date: _____________
Tester: _____________

| Test | Status | Notes |
|------|--------|-------|
| Template exists | ⬜ Pass ⬜ Fail | |
| Backend starts | ⬜ Pass ⬜ Fail | |
| API responds | ⬜ Pass ⬜ Fail | |
| Frontend loads | ⬜ Pass ⬜ Fail | |
| Text processing | ⬜ Pass ⬜ Fail | |
| PDF generates | ⬜ Pass ⬜ Fail | |
| Content correct | ⬜ Pass ⬜ Fail | |
| Template applied | ⬜ Pass ⬜ Fail | |
| Fallback works | ⬜ Pass ⬜ Fail | |
| History works | ⬜ Pass ⬜ Fail | |

## Success Criteria

✅ **System is working if:**
1. PDF generates within 10 seconds
2. Template design is visible in PDF
3. Content is reframed professionally
4. All placeholders are replaced correctly
5. No errors in console
6. Downloaded file is valid PDF (or DOCX)

## Next Steps After Testing

If all tests pass:
- ✅ System is ready for production use
- ✅ Train team members on new feature
- ✅ Update user documentation
- ✅ Notify users about improved PDFs

If tests fail:
- Check backend console logs
- Verify template file location
- Check package installations
- Review error messages
- Contact support with error details

---

**Ready to test?** Run Option 3 (Frontend UI) for the easiest test!
