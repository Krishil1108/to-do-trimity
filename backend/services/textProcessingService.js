const axios = require('axios');
const translate = require('translate-google');
const { correctGrammarWithChatGPT } = require('./chatGPTGrammarService');

class TextProcessingService {
  constructor() {
    // LibreTranslate API
    this.libreTranslateUrl = 'https://libretranslate.com/translate';
    this.libreTranslateApiKey = process.env.LIBRETRANSLATE_API_KEY || '';
  }

  /**
   * Detect if text is in Gujarati
   * @param {string} text - Text to check
   * @returns {boolean} - True if text contains Gujarati characters
   */
  isGujarati(text) {
    const gujaratiPattern = /[\u0A80-\u0AFF]/;
    return gujaratiPattern.test(text);
  }

  /**
   * Translate Gujarati text to English
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
   * Improve English text using ChatGPT-4o-mini
   * @param {string} text - Text to improve
   * @returns {Promise<string>} - Improved text
   */
  async improveEnglishText(text) {
    try {
      // Apply ChatGPT-4o-mini grammar correction
      let correctedText = await this.applyAdvancedGrammarRules(text);
      
      // Post-process for cleanup
      correctedText = this.postProcessGrammar(correctedText);
      
      return this.enhanceTextProfessionalism(correctedText);
      
    } catch (error) {
      console.error('❌ ChatGPT grammar correction failed:', error.message);
      // Return original text if processing fails
      return text;
    }
  }

  /**
   * Apply comprehensive grammar rules using ChatGPT-4o-mini
   * @param {string} text - Text to correct
   * @returns {Promise<string>} - Corrected text
   */
  async applyAdvancedGrammarRules(text) {
    try {
      // Use ChatGPT-4o-mini for professional grammar correction
      const corrected = await correctGrammarWithChatGPT(text);
      return corrected;
    } catch (error) {
      console.error('❌ ChatGPT grammar correction failed:', error.message);
      // Return original text if ChatGPT fails
      return text;
    }
  }

  /**
   * Simple post-processing for minor cleanup
   * @param {string} text - Text to post-process
   * @returns {string} - Cleaned text
   */
  postProcessGrammar(text) {
    let corrected = text;
    
    // Fix double spaces
    corrected = corrected.replace(/\s{2,}/g, ' ');
    
    // Fix space before punctuation
    corrected = corrected.replace(/\s+([.,!?;:])/g, '$1');
    
    // Capitalize first letter of sentences
    corrected = corrected.replace(/(^|[.!?]\s+)([a-z])/g, (match, prefix, letter) => {
      return prefix + letter.toUpperCase();
    });
    
    return corrected.trim();
  }

  /**
   * Enhance text professionalism for MOM documents
   * @param {string} text - Text to enhance
   * @returns {string} - Enhanced text
   */
  enhanceTextProfessionalism(text) {
    let enhanced = text;

    // Capitalize "I"
    enhanced = enhanced.replace(/\bi\b/g, 'I');

    // Fix common informal phrases
    const replacements = {
      "gonna": "going to",
      "wanna": "want to",
      "gotta": "got to",
      "kinda": "kind of",
      "sorta": "sort of",
      "yeah": "yes",
      "nope": "no",
      "ok": "okay",
      "thru": "through",
      "cause": "because"
    };

    for (const [informal, formal] of Object.entries(replacements)) {
      const regex = new RegExp(`\\b${informal}\\b`, 'gi');
      enhanced = enhanced.replace(regex, formal);
    }

    // Remove excessive punctuation
    enhanced = enhanced.replace(/([!?]){2,}/g, '$1');
    enhanced = enhanced.replace(/\.{4,}/g, '...');

    // Ensure proper sentence ending
    if (enhanced && !enhanced.match(/[.!?]$/)) {
      enhanced += '.';
    }

    return enhanced;
  }

  /**
   * Process MOM text comprehensively
   * 1. Translate Gujarati to English
   * 2. Fix English grammar using ChatGPT
   * 3. Enhance professionalism
   * @param {string} text - Input text (Gujarati or English)
   * @returns {Promise<string>} - Processed English text
   */
  async processText(text) {
    if (!text || text.trim() === '') {
      return '';
    }

    try {
      let englishText = text;

      // Step 1: Translate if Gujarati
      if (this.isGujarati(text)) {
        console.log('Detected Gujarati text, translating...');
        englishText = await this.translateGujaratiToEnglish(text);
        console.log('Translation complete');
      }

      // Step 2 & 3: Improve English (ChatGPT handles all grammar)
      const improvedText = await this.improveEnglishText(englishText);

      return improvedText;
    } catch (error) {
      console.error('Text processing error:', error);
      return text; // Return original text if processing fails
    }
  }

  /**
   * Process MOM text and return formatted result
   * Used by the MOM API endpoint
   * @param {string} text - Input text (Gujarati or improper English)
   * @returns {Promise<Object>} - Result object with success flag and processed text
   */
  async processMOMText(text) {
    try {
      if (!text || text.trim() === '') {
        return {
          success: false,
          error: 'Empty text provided'
        };
      }

      const processedText = await this.processText(text);
      
      return {
        success: true,
        originalText: text,
        processedText: processedText,
        isGujarati: this.isGujarati(text)
      };
    } catch (error) {
      console.error('❌ MOM text processing error:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to process text',
        originalText: text
      };
    }
  }
}

module.exports = new TextProcessingService();
