# Grammar Testing Console Tools

## Overview
The frontend application now includes built-in grammar testing tools accessible via the browser console. This allows you to test grammar corrections in real-time without needing to run separate backend test scripts.

## How to Use

### 1. Open the Application
Start the frontend application and open it in your browser:
```
http://localhost:3000
```

### 2. Open Browser Console
- **Chrome/Edge**: Press `F12` or `Ctrl+Shift+J` (Windows) / `Cmd+Option+J` (Mac)
- **Firefox**: Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)

### 3. Available Commands

#### Test Single Sentence
```javascript
window.testGrammar("i want to go for shopping and eating chocolate")
```

**Output:**
```
================================================================================
🧪 GRAMMAR TEST
================================================================================

📝 INPUT:  i want to go for shopping and eating chocolate

✅ OUTPUT: I want to go shopping and eat chocolate

⏱️  Processing time: 245ms

✨ Changes detected:
   Word 1: "i" → "I"
   Word 5: "for" → "(removed)"
   Word 7: "eating" → "eat"

================================================================================
```

#### Test Multiple Sentences
```javascript
window.testGrammar([
  "i want to go for shopping",
  "he go to school everyday",
  "she are working hard"
])
```

**Output:**
```
================================================================================
🧪 BATCH GRAMMAR TEST
Testing 3 sentences
================================================================================

[1/3] 📝 INPUT:  i want to go for shopping
      ✅ OUTPUT: I want to go shopping

[2/3] 📝 INPUT:  he go to school everyday
      ✅ OUTPUT: He goes to school every day

[3/3] 📝 INPUT:  she are working hard
      ✅ OUTPUT: She is working hard

────────────────────────────────────────────────────────────────────────────────
📊 SUMMARY:
   ✨ Changed:   3/3
   ✓  Unchanged: 0/3
================================================================================
```

#### Detailed Test with Expected Output
```javascript
window.testGrammarDetailed(
  "because the deadline was approaching they worked late",
  "Because the deadline was approaching, they worked late"
)
```

**Output:**
```
================================================================================
🔍 DETAILED GRAMMAR TEST
================================================================================

📝 INPUT:
   "because the deadline was approaching they worked late"

🎯 EXPECTED:
   "Because the deadline was approaching, they worked late"

✅ ACTUAL OUTPUT:
   "Because the deadline was approaching, they worked late"

⏱️  Processing time: 312ms

✅ PERFECT MATCH! Output matches expected result.

📊 ANALYSIS:
   Input words:  8
   Output words: 9
   Characters:   53 → 54 (+1)

================================================================================
```

#### Just Get Corrected Text (No Formatting)
```javascript
const corrected = await window.checkGrammar("your text here");
console.log(corrected);
```

#### Run Full Test Suite
```javascript
window.runGrammarTests()
```

This runs a comprehensive test suite covering:
- Idiomatic verbs ("go for shopping" → "go shopping")
- Parallel structure ("reading and to write" → "reading and writing")
- Subject-verb agreement ("she go" → "she goes")
- Past tense narratives
- Articles ("bought new car" → "bought a new car")
- Modal verbs ("can helped" → "can help")
- Prepositions ("good in" → "good at")
- For vs To ("for complete" → "to complete")

## Test Examples

### Test User's Real Sentence
```javascript
window.testGrammar("I want to go for shopping and eating chocolate to make my 31st night amazing")
```

### Test Tense Consistency
```javascript
window.testGrammarDetailed(
  "Because the deadline was approaching, they worked late in the office to finalize the proposal so the client could review it before the next meeting",
  "Because the deadline was approaching, they worked late in the office to finalize the proposal so the client could review it before the next meeting"
)
```

### Test Multiple Patterns at Once
```javascript
window.testGrammar([
  "i want to go for shopping",
  "he likes reading and to write",
  "she go to school everyday",
  "for make this work we need time",
  "they can helped tomorrow"
])
```

## Tips

1. **Copy-Paste Testing**: Copy sentences from your meeting notes and paste them directly into the console
2. **Batch Testing**: Test multiple variations at once to see consistency
3. **Compare Results**: Use `testGrammarDetailed()` to compare actual vs expected outputs
4. **Performance**: Check processing times to monitor API response speed
5. **Real-time**: Test while the app is running to see live grammar corrections

## Common Issues Tested

✅ **Fixed Issues:**
- Idiomatic verbs: "go for shopping" → "go shopping"
- Parallel structure: "go...and eating" → "go...and eat"
- "For" vs "To": "for make" → "to make"
- Modal + base verb: "can helped" → "can help"
- Subject-verb agreement: "he go" → "he goes"

⚠️ **Known Limitations:**
- Perfect continuous gerunds may have edge cases
- Some phrasal verbs need manual review
- Reported speech conversion not yet implemented

## Backend Integration

These tools connect to the `/api/mom/process-text` endpoint, which uses the same grammar correction engine as the main application. Changes made to `textProcessingService.js` are immediately testable through these console tools.

## Development Workflow

1. Make changes to `backend/services/textProcessingService.js`
2. Restart backend server
3. Refresh frontend (or wait for hot reload)
4. Test immediately in console with `window.testGrammar()`
5. Iterate quickly without writing separate test files

## See Also

- `backend/services/textProcessingService.js` - Main grammar correction engine
- `frontend/src/utils/grammarTester.js` - Console testing implementation
- `docs/MOM_SYSTEM.md` - Meeting notes processing documentation
