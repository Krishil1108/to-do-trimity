const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const translate = require('translate-google');
const writeGood = require('write-good');

class TextProcessingService {
  constructor() {
    // Initialize Gemini AI (free tier available)
    // You can set GEMINI_API_KEY in .env for production
    this.apiKey = process.env.GEMINI_API_KEY || 'free-tier';
    this.genAI = this.apiKey !== 'free-tier' ? new GoogleGenerativeAI(this.apiKey) : null;
    
    // LibreTranslate API - using public instance (optional fallback)
    this.libreTranslateUrl = 'https://libretranslate.com/translate';
    this.libreTranslateApiKey = process.env.LIBRETRANSLATE_API_KEY || '';
  }

  /**
   * Detect if text is in Gujarati
   * @param {string} text - Text to check
   * @returns {boolean} - True if text contains Gujarati characters
   */
  isGujarati(text) {
    // Gujarati Unicode range: \u0A80-\u0AFF
    const gujaratiPattern = /[\u0A80-\u0AFF]/;
    return gujaratiPattern.test(text);
  }

  /**
   * Translate Gujarati text to English
   * Tries LibreTranslate first (if API key available), falls back to Google Translate
   * @param {string} text - Gujarati text
   * @returns {Promise<string>} - Translated English text
   */
  async translateGujaratiToEnglish(text) {
    // Try LibreTranslate if API key is available
    if (this.libreTranslateApiKey) {
      try {
        const response = await axios.post(this.libreTranslateUrl, {
          q: text,
          source: 'auto',
          target: 'en',
          format: 'text',
          api_key: this.libreTranslateApiKey
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        });
        
        return response.data.translatedText;
      } catch (error) {
        console.log('LibreTranslate failed, falling back to Google Translate');
      }
    }
    
    // Fallback to Google Translate
    try {
      const result = await translate(text, { from: 'gu', to: 'en' });
      return result;
    } catch (error) {
      console.error('Translation error:', error.message);
      return text;
    }
  }

  /**
   * Improve English text using LanguageTool API + advanced grammar rules
   * Falls back to Gemini AI if available, then basic cleanup
   * @param {string} text - Text to improve
   * @returns {Promise<string>} - Improved text
   */
  async improveEnglishText(text) {
    // Try LanguageTool public API first (free, no key needed)
    try {
      console.log('🔧 Using LanguageTool API for grammar correction...');
      
      const response = await axios.post('https://api.languagetoolplus.com/v2/check', null, {
        params: {
          text: text,
          language: 'en-US',
          enabledOnly: 'false'
        },
        timeout: 10000
      });
      
      if (response.data && response.data.matches && response.data.matches.length > 0) {
        let correctedText = text;
        
        // Apply corrections in reverse order to maintain offset positions
        const sortedMatches = response.data.matches
          .filter(m => m.replacements && m.replacements.length > 0)
          .sort((a, b) => b.offset - a.offset);
        
        for (const match of sortedMatches) {
          const replacement = match.replacements[0].value;
          const start = match.offset;
          const end = match.offset + match.length;
          
          correctedText = 
            correctedText.substring(0, start) + 
            replacement + 
            correctedText.substring(end);
        }
        
        console.log(`✅ LanguageTool: Fixed ${sortedMatches.length} issues`);
        
        // Apply additional advanced grammar corrections
        correctedText = this.applyAdvancedGrammarRules(correctedText);
        
        return this.enhanceTextProfessionalism(correctedText);
      }
      
      // No LanguageTool corrections, but apply advanced rules
      console.log('✅ LanguageTool: No corrections needed, applying advanced rules...');
      const advancedCorrected = this.applyAdvancedGrammarRules(text);
      return this.enhanceTextProfessionalism(advancedCorrected);
      
    } catch (languageToolError) {
      console.log('⚠️ LanguageTool API failed, trying Gemini AI...', languageToolError.message);
      
      // Fallback to Gemini if available
      if (this.genAI) {
        try {
          const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          
          const prompt = `You are a professional document editor. Improve the following text for a Minutes of Meeting (MOM) document. 

Fix grammar, spelling, and make it more professional and clear. Keep the same meaning and facts.
Maintain bullet points if present. Format it properly for a formal business document.

Original text:
${text}

Provide only the improved text without any explanations or meta-commentary:`;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          return response.text().trim();
        } catch (error) {
          console.error('Gemini AI error:', error.message || error);
          // Fallback to basic cleaning
          return this.basicTextCleanup(text);
        }
      } else {
        // Fallback to basic cleanup if no API key
        const advancedCorrected = this.applyAdvancedGrammarRules(text);
        return this.basicTextCleanup(advancedCorrected);
      }
    }
  }

  /**
   * Apply advanced grammar rules for tense, subject-verb agreement, etc.
   * @param {string} text - Text to correct
   * @returns {string} - Corrected text
   */
  applyAdvancedGrammarRules(text) {
    let corrected = text;
    
    // Fix past tense with future time markers
    corrected = corrected
      // "was/were [verb]ing tomorrow/next week/later" -> "will be [verb]ing"
      .replace(/\b(was|were)\s+(\w+ing)\s+(tomorrow|next\s+\w+|later|soon|tonight)\b/gi, 
        (match, pastVerb, presentParticiple, timeMarker) => {
          return `will be ${presentParticiple} ${timeMarker}`;
        })
      // "was/were going to [verb]" -> "will be going to [verb]"
      .replace(/\b(was|were)\s+going\s+to\s+(\w+)\s+(tomorrow|next\s+\w+|later|soon)\b/gi,
        (match, pastVerb, verb, timeMarker) => {
          return `will be going to ${verb} ${timeMarker}`;
        });
    
    // Fix pronoun case (me/I, him/he, etc.) BEFORE verb agreement
    corrected = corrected
      // "me and [name/pronoun]" at start of sentence -> "I and"
      .replace(/\bMe\s+and\s+(\w+)/g, 'I and $1')
      // "him and [pronoun]" at start -> "he and"
      .replace(/\bHim\s+and\s+(\w+)/g, 'He and $1')
      // "her and [pronoun]" at start -> "she and"  
      .replace(/\bHer\s+and\s+(\w+)\s+/gi, 'She and $1 ');
    
    // Fix subject-verb agreement (do this AFTER pronoun fixes)
    corrected = corrected
      // Compound subjects (X and Y) always use "were" (plural)
      .replace(/\b(\w+)\s+and\s+(\w+)\s+was\b/gi, '$1 and $2 were')
      // "I/we/they was" -> "I/we/they were"
      .replace(/\b(I|we|they)\s+was\b/gi, '$1 were')
      // "he/she/it were" -> "he/she/it was"
      .replace(/\b(he|she|it)\s+were\b/gi, '$1 was')
      // "I is" -> "I am"
      .replace(/\bI\s+is\b/gi, 'I am')
      // "you is" -> "you are"
      .replace(/\byou\s+is\b/gi, 'you are')
      // "we/they is" -> "we/they are"
      .replace(/\b(we|they)\s+is\b/gi, '$1 are');
    
    // Fix double negatives
    corrected = corrected
      .replace(/\bdon't\s+have\s+no\b/gi, "don't have any")
      .replace(/\bcan't\s+get\s+no\b/gi, "can't get any")
      .replace(/\bdidn't\s+see\s+nothing\b/gi, "didn't see anything");
    
    // Fix incorrect verb forms
    corrected = corrected
      .replace(/\bhas\s+went\b/gi, 'has gone')
      .replace(/\bhave\s+went\b/gi, 'have gone')
      .replace(/\bhas\s+came\b/gi, 'has come')
      .replace(/\bhave\s+came\b/gi, 'have come')
      .replace(/\bhas\s+did\b/gi, 'has done')
      .replace(/\bhave\s+did\b/gi, 'have done')
      .replace(/\bhas\s+saw\b/gi, 'has seen')
      .replace(/\bhave\s+saw\b/gi, 'have seen');
    
    return corrected;
  }

  /**
   * Enhance text professionalism after grammar correction
   * @param {string} text - Grammar-corrected text
   * @returns {string} - Enhanced professional text
   */
  enhanceTextProfessionalism(text) {
    let enhanced = text
      // Capitalize first letter of sentences
      .replace(/(^\w|[.!?]\s+\w)/g, (match) => match.toUpperCase())
      // Fix spacing around punctuation
      .replace(/\s+([,.!?;:])/g, '$1')
      .replace(/([,.!?;:])\s*([a-zA-Z])/g, '$1 $2')
      // Fix multiple spaces
      .replace(/\s+/g, ' ')
      // Fix multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      // Professional replacements
      .replace(/\bthanks\b/gi, 'Thank you')
      .replace(/\bpls\b/gi, 'please')
      .replace(/\basap\b/gi, 'as soon as possible')
      .replace(/\bbtw\b/gi, 'by the way')
      .replace(/\bfyi\b/gi, 'for your information')
      .trim();
    
    return enhanced;
  }

  /**
   * Basic text cleanup with enhanced grammar correction
   * @param {string} text - Text to clean
   * @returns {string} - Cleaned text
   */
  basicTextCleanup(text) {
    let cleaned = text
      // Fix multiple spaces
      .replace(/\s+/g, ' ')
      // Fix multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      // Common spelling corrections
      .replace(/\babot\b/gi, 'about')
      .replace(/\bdiscus\b/gi, 'discuss')
      .replace(/\bbudjet\b/gi, 'budget')
      .replace(/\bhandel\b/gi, 'handle')
      .replace(/\bmeetin\b/gi, 'meeting')
      .replace(/\btodays\b/gi, "today's")
      .replace(/\bwas abot\b/gi, 'was about')
      .replace(/\bwill handel\b/gi, 'will handle')
      // Fix common grammar issues
      .replace(/\bi is\b/gi, 'I am')
      .replace(/\bhe go\b/gi, 'he goes')
      .replace(/\bshe go\b/gi, 'she goes')
      .replace(/\bthey was\b/gi, 'they were')
      .replace(/\bwe was\b/gi, 'we were')
      .replace(/\bhas went\b/gi, 'has gone')
      .replace(/\bhave went\b/gi, 'have gone')
      .replace(/\bwas not able to performed\b/gi, 'was not able to perform')
      .replace(/\bwill be performed\b/gi, 'will be done')
      // Add missing punctuation
      .replace(/([a-z])(\s+[A-Z])/g, '$1.$2')
      // Capitalize first letter of sentences
      .replace(/(^\w|[.!?]\s+\w)/g, (match) => match.toUpperCase())
      // Fix spacing around punctuation
      .replace(/\s+([,.!?;:])/g, '$1')
      .replace(/([,.!?;:])\s*([a-zA-Z])/g, '$1 $2')
      // Trim whitespace
      .trim();
    
    return cleaned;
  }

  /**
   * Process MOM text: detect language, translate if needed, and improve
   * @param {string} rawText - Raw MOM text (can be Gujarati, improper English, etc.)
   * @returns {Promise<object>} - Processed result with original and improved text
   */
  async processMOMText(rawText) {
    try {
      let processedText = rawText;
      let detectedLanguage = 'en';
      let wasTranslated = false;

      // Step 1: Check if text is in Gujarati
      if (this.isGujarati(rawText)) {
        console.log('📝 Detected Gujarati text, translating...');
        detectedLanguage = 'gu';
        processedText = await this.translateGujaratiToEnglish(rawText);
        wasTranslated = true;
        console.log('✅ Translation completed');
      }

      // Step 2: Improve the English text
      console.log('✨ Improving text quality...');
      const improvedText = await this.improveEnglishText(processedText);
      console.log('✅ Text improvement completed');

      return {
        success: true,
        original: rawText,
        detectedLanguage,
        wasTranslated,
        translated: wasTranslated ? processedText : null,
        improved: improvedText,
        final: improvedText
      };
    } catch (error) {
      console.error('Error processing MOM text:', error);
      
      // Return basic cleaned version as fallback
      return {
        success: true,
        original: rawText,
        detectedLanguage: 'unknown',
        wasTranslated: false,
        translated: null,
        improved: this.basicTextCleanup(rawText),
        final: this.basicTextCleanup(rawText),
        warning: 'AI processing failed, basic cleanup applied'
      };
    }
  }

  /**
   * Format MOM text with proper structure
   * @param {object} momData - MOM data including title, attendees, content, etc.
   * @returns {string} - Formatted MOM text
   */
  formatMOMDocument(momData) {
    const {
      title = 'Minutes of Meeting',
      date = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time,
      location,
      attendees = [],
      agenda,
      discussion,
      actionItems = [],
      nextMeetingDate
    } = momData;

    let formatted = `${title}\n\n`;
    formatted += `Date: ${date}\n`;
    if (time) formatted += `Time: ${time}\n`;
    if (location) formatted += `Location: ${location}\n`;
    formatted += `\n`;

    if (attendees.length > 0) {
      formatted += `Attendees:\n`;
      attendees.forEach(attendee => {
        formatted += `• ${attendee}\n`;
      });
      formatted += `\n`;
    }

    if (agenda) {
      formatted += `Agenda:\n${agenda}\n\n`;
    }

    if (discussion) {
      formatted += `Discussion:\n${discussion}\n\n`;
    }

    if (actionItems.length > 0) {
      formatted += `Action Items:\n`;
      actionItems.forEach((item, index) => {
        formatted += `${index + 1}. ${item}\n`;
      });
      formatted += `\n`;
    }

    if (nextMeetingDate) {
      formatted += `Next Meeting: ${nextMeetingDate}\n`;
    }

    return formatted;
  }
}

module.exports = new TextProcessingService();
