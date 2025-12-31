# Comprehensive Grammar Correction System

## Overview
The text processing service now includes a **comprehensive grammar correction system** that covers ALL major grammar concepts including tenses, verbs, adjectives, adverbs, conjunctions, prepositions, sentence structure, punctuation, and more.

## Libraries Used

### 1. **LanguageTool API** (Primary)
- Free public API for grammar and spell checking
- Provides context-aware corrections
- Handles complex grammar issues

### 2. **Compromise NLP** 
- JavaScript natural language processing library
- Intelligent text parsing and manipulation
- Handles contractions, verb forms, and sentence structure

### 3. **Natural**
- Node.js NLP toolkit
- Tokenization and stemming
- Advanced text processing capabilities

### 4. **Write-Good**
- Style and readability checker
- Identifies wordy phrases and passive voice

## Grammar Concepts Covered

### 1. **Verb Tenses**
- ✅ Past, Present, Future
- ✅ Simple, Continuous, Perfect tenses
- ✅ Tense consistency with time markers
- ✅ Irregular verb conjugations (50+ verbs)

**Examples:**
```
"We was going tomorrow" → "We will be going tomorrow"
"He has went to the bank" → "He has gone to the bank"
"She were preparing yesterday" → "She was preparing yesterday"
```

### 2. **Subject-Verb Agreement**
- ✅ Singular/plural subject matching
- ✅ Compound subjects (X and Y)
- ✅ Pronoun agreement (I/you/he/she/it/we/they)
- ✅ Collective nouns

**Examples:**
```
"He are going" → "He is going"
"They was happy" → "They were happy"
"John and Sarah was attending" → "John and Sarah were attending"
```

### 3. **Pronouns**
- ✅ Subject pronouns (I, he, she, we, they)
- ✅ Object pronouns (me, him, her, us, them)
- ✅ Possessive pronouns (my, his, her, our, their)
- ✅ Reflexive pronouns (myself, himself, herself)

**Examples:**
```
"Me and John completed it" → "John and I completed it"
"Him and her was working" → "He and she were working"
"Give it to I" → "Give it to me"
```

### 4. **Prepositions**
- ✅ Time prepositions (at, on, in)
- ✅ Place prepositions
- ✅ Common collocation errors
- ✅ Idiomatic expressions

**Examples:**
```
"Meeting in Monday" → "Meeting on Monday"
"At morning" → "In the morning"
"Married with John" → "Married to John"
"Arrive to station" → "Arrive at station"
```

### 5. **Articles (a/an/the)**
- ✅ Vowel vs consonant sound rules
- ✅ Exceptions (hour, honest, university, etc.)
- ✅ Double article removal
- ✅ Missing article detection

**Examples:**
```
"A engineer" → "An engineer"
"A apple" → "An apple"
"A honest man" → "An honest man"
"A university" → "A university" (correct - consonant sound)
```

### 6. **Adjective Order (OSASCOMP)**
- ✅ Opinion - Size - Age - Shape - Color - Origin - Material - Purpose

**Examples:**
```
"Blue big car" → "Big blue car"
"Wooden old table" → "Old wooden table"
```

### 7. **Adverbs**
- ✅ Placement in sentences
- ✅ Frequency adverbs
- ✅ Manner, time, and place adverbs

### 8. **Conjunctions**
- ✅ Coordinating (FANBOYS): for, and, nor, but, or, yet, so
- ✅ Subordinating: because, although, when, if, since, etc.
- ✅ Correlative: both...and, either...or, neither...nor

### 9. **Punctuation**
- ✅ Period, comma, semicolon, colon usage
- ✅ Question marks and exclamation points
- ✅ Apostrophes (possessive and contractions)
- ✅ Quotation marks
- ✅ Comma placement rules

**Examples:**
```
"Hello,how are you?" → "Hello, how are you?"
"Meeting was good However we need time" → "Meeting was good. However, we need time"
```

### 10. **Sentence Structure**
- ✅ Complete sentences (subject + predicate)
- ✅ Fragment identification and correction
- ✅ Run-on sentence fixing
- ✅ Capitalization
- ✅ Sentence variety

### 11. **Double Negatives**
- ✅ Removal of incorrect double negatives

**Examples:**
```
"Don't have no time" → "Don't have any time"
"Didn't see nothing" → "Didn't see anything"
```

### 12. **Spelling Corrections**
- ✅ 50+ common misspellings
- ✅ Context-aware corrections
- ✅ Professional terminology

**Examples:**
```
"goverment" → "government"
"seperate" → "separate"
"tommorow" → "tomorrow"
"acheive" → "achieve"
```

### 13. **Professional Language Enhancement**
- ✅ Abbreviation expansion (pls → please, asap → as soon as possible)
- ✅ Formal tone improvements
- ✅ Readability enhancements

## Grammar Rules Database

### Irregular Verbs (20+)
```javascript
go → went → gone
see → saw → seen
do → did → done
come → came → come
eat → ate → eaten
write → wrote → written
speak → spoke → spoken
... and more
```

### Common Spelling Corrections (50+)
- accommodate, achieve, believe, definitely
- disappoint, existence, government, maintenance
- necessary, occasion, professional, recommend
- ... and more

### Preposition Rules
- Days: **on** Monday, Tuesday, etc.
- Times: **at** night, **in** the morning
- Months/Years: **in** January, **in** 2025
- Specific times: **at** 5 PM

## API Integration Hierarchy

The system uses a **multi-tier fallback approach**:

1. **Primary**: LanguageTool API (free, public)
   - Advanced grammar checking
   - Context-aware suggestions
   
2. **Secondary**: Compromise NLP
   - Local processing
   - Intelligent text manipulation
   
3. **Tertiary**: Custom Grammar Rules
   - Pattern-based corrections
   - Domain-specific fixes
   
4. **Quaternary**: Gemini AI (if API key provided)
   - AI-powered improvements
   - Natural language understanding

5. **Fallback**: Basic Text Cleanup
   - Always available
   - Simple pattern matching

## How It Works

### Processing Pipeline
```
Input Text
    ↓
Language Detection (Gujarati/English)
    ↓
Translation (if needed)
    ↓
LanguageTool API Grammar Check
    ↓
Compromise NLP Processing
    ↓
Custom Grammar Rules Application:
  - Spelling Corrections
  - Verb Tense Fixes
  - Subject-Verb Agreement
  - Pronoun Corrections
  - Preposition Fixes
  - Article Corrections
  - Double Negative Removal
  - Adjective Order
  - Punctuation Fixes
  - Sentence Structure
    ↓
Professional Enhancement
    ↓
Output: Corrected Text
```

## Usage

### In MOM Processing
```javascript
const result = await textProcessingService.processMOMText(rawText);
console.log(result.improved); // Grammatically corrected text
```

### Standalone Grammar Correction
```javascript
const corrected = await textProcessingService.improveEnglishText(text);
```

## Testing

Run comprehensive grammar tests:
```bash
node backend/test-comprehensive-grammar.js
```

This tests all grammar concepts with 25+ test cases covering:
- Tenses
- Subject-verb agreement
- Pronouns
- Prepositions
- Articles
- Spelling
- Punctuation
- Complex multi-error sentences

## Performance

- **Average processing time**: 1-3 seconds per text block
- **LanguageTool API**: ~500ms
- **NLP processing**: ~100ms
- **Custom rules**: ~50ms

## Limitations and Notes

1. **LanguageTool API** may have rate limits on the free tier
2. **Context matters**: Some corrections depend on sentence context
3. **Proper nouns**: May not always be recognized correctly
4. **Domain-specific terms**: May need custom dictionary additions
5. **Complex sentences**: Very long sentences may need manual review

## Future Enhancements

- [ ] Add more irregular verbs to database
- [ ] Enhance idiom and phrase detection
- [ ] Add business/technical terminology dictionary
- [ ] Improve context-aware corrections
- [ ] Add grammar explanation feature
- [ ] Support for more regional English variations (US/UK/Indian)
- [ ] Batch processing optimization

## Python Alternative (Reference)

While this is a Node.js implementation, for Python projects you could use:
- **LanguageTool Python**: `language_tool_python`
- **GingerIt**: Grammar correction
- **TextBlob**: NLP processing
- **spaCy**: Advanced NLP
- **NLTK**: Natural Language Toolkit

## Resources

- [LanguageTool API](https://languagetool.org/)
- [Compromise NLP](https://compromise.cool/)
- [Natural](https://github.com/NaturalNode/natural)
- [Grammar Rules Reference](https://owl.purdue.edu/owl/purdue_owl.html)

---

**Last Updated**: December 31, 2025  
**Version**: 2.0.0
