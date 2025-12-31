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
   * Improve English text using LanguageTool API + write-good
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
          language: 'en-US'
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
        return this.enhanceTextProfessionalism(correctedText);
      }
      
      // No corrections needed
      console.log('✅ LanguageTool: No corrections needed');
      return this.enhanceTextProfessionalism(text);
      
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
        return this.basicTextCleanup(text);
      }
    }
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
