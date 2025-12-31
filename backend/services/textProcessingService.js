const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const translate = require('translate-google');
const writeGood = require('write-good');
const nlp = require('compromise');
const sentences = require('compromise-sentences');
const numbers = require('compromise-numbers');
const natural = require('natural');

// Extend compromise with plugins
nlp.extend(sentences);
nlp.extend(numbers);

class TextProcessingService {
  constructor() {
    // Initialize Gemini AI (free tier available)
    // You can set GEMINI_API_KEY in .env for production
    this.apiKey = process.env.GEMINI_API_KEY || 'free-tier';
    this.genAI = this.apiKey !== 'free-tier' ? new GoogleGenerativeAI(this.apiKey) : null;
    
    // LibreTranslate API - using public instance (optional fallback)
    this.libreTranslateUrl = 'https://libretranslate.com/translate';
    this.libreTranslateApiKey = process.env.LIBRETRANSLATE_API_KEY || '';
    
    // Initialize Natural NLP tokenizer for advanced processing
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    
    // Comprehensive grammar rule sets
    this.initializeGrammarRules();
  }

  /**
   * Initialize comprehensive grammar rules database
   * Covers: tenses, verbs, adjectives, adverbs, conjunctions, prepositions, etc.
   */
  initializeGrammarRules() {
    // VERB FORMS - Irregular verb conjugations
    this.irregularVerbs = {
      'go': { past: 'went', pastParticiple: 'gone', presentParticiple: 'going', thirdPerson: 'goes' },
      'come': { past: 'came', pastParticiple: 'come', presentParticiple: 'coming', thirdPerson: 'comes' },
      'do': { past: 'did', pastParticiple: 'done', presentParticiple: 'doing', thirdPerson: 'does' },
      'see': { past: 'saw', pastParticiple: 'seen', presentParticiple: 'seeing', thirdPerson: 'sees' },
      'eat': { past: 'ate', pastParticiple: 'eaten', presentParticiple: 'eating', thirdPerson: 'eats' },
      'run': { past: 'ran', pastParticiple: 'run', presentParticiple: 'running', thirdPerson: 'runs' },
      'write': { past: 'wrote', pastParticiple: 'written', presentParticiple: 'writing', thirdPerson: 'writes' },
      'speak': { past: 'spoke', pastParticiple: 'spoken', presentParticiple: 'speaking', thirdPerson: 'speaks' },
      'know': { past: 'knew', pastParticiple: 'known', presentParticiple: 'knowing', thirdPerson: 'knows' },
      'take': { past: 'took', pastParticiple: 'taken', presentParticiple: 'taking', thirdPerson: 'takes' },
      'give': { past: 'gave', pastParticiple: 'given', presentParticiple: 'giving', thirdPerson: 'gives' },
      'make': { past: 'made', pastParticiple: 'made', presentParticiple: 'making', thirdPerson: 'makes' },
      'find': { past: 'found', pastParticiple: 'found', presentParticiple: 'finding', thirdPerson: 'finds' },
      'think': { past: 'thought', pastParticiple: 'thought', presentParticiple: 'thinking', thirdPerson: 'thinks' },
      'get': { past: 'got', pastParticiple: 'gotten', presentParticiple: 'getting', thirdPerson: 'gets' },
      'begin': { past: 'began', pastParticiple: 'begun', presentParticiple: 'beginning', thirdPerson: 'begins' },
      'feel': { past: 'felt', pastParticiple: 'felt', presentParticiple: 'feeling', thirdPerson: 'feels' },
      'bring': { past: 'brought', pastParticiple: 'brought', presentParticiple: 'bringing', thirdPerson: 'brings' },
      'buy': { past: 'bought', pastParticiple: 'bought', presentParticiple: 'buying', thirdPerson: 'buys' },
      'build': { past: 'built', pastParticiple: 'built', presentParticiple: 'building', thirdPerson: 'builds' }
    };

    // SUBJECT-VERB AGREEMENT RULES
    this.subjectVerbRules = {
      singular: ['he', 'she', 'it', 'this', 'that'],
      plural: ['we', 'they', 'these', 'those'],
      alwaysPlural: ['I', 'you']
    };

    // PREPOSITION RULES - Common preposition usage patterns
    this.prepositionRules = {
      time: {
        'at': ['time', 'night', 'noon', 'midnight', 'dawn', 'dusk'],
        'on': ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'day', 'date'],
        'in': ['morning', 'afternoon', 'evening', 'month', 'year', 'season', 'century']
      },
      place: {
        'at': ['point', 'address', 'position'],
        'in': ['city', 'country', 'room', 'building', 'box', 'container'],
        'on': ['surface', 'floor', 'street', 'road', 'page']
      }
    };

    // CONJUNCTION TYPES
    this.conjunctions = {
      coordinating: ['and', 'but', 'or', 'nor', 'for', 'yet', 'so'], // FANBOYS
      subordinating: ['after', 'although', 'as', 'because', 'before', 'if', 'once', 'since', 
                      'than', 'that', 'though', 'till', 'until', 'when', 'where', 'whether', 'while'],
      correlative: [
        { pair: ['both', 'and'] },
        { pair: ['either', 'or'] },
        { pair: ['neither', 'nor'] },
        { pair: ['not only', 'but also'] },
        { pair: ['whether', 'or'] }
      ]
    };

    // ARTICLES RULES
    this.articleRules = {
      'a': /^[bcdfghjklmnpqrstvwxyz]/i, // consonant sound
      'an': /^[aeiou]/i, // vowel sound
      exceptions: {
        'an': ['hour', 'honest', 'honor', 'heir', 'mba', 'fbi'], // silent H or vowel sound
        'a': ['one', 'user', 'university', 'european', 'uniform'] // consonant sound
      }
    };

    // PUNCTUATION RULES
    this.punctuationRules = {
      endMarks: ['.', '!', '?'],
      commaUses: ['list separator', 'after introductory', 'before conjunction', 'non-essential clauses'],
      semicolonUse: 'independent clauses',
      colonUse: 'introduce list or explanation',
      apostrophe: ['possessive', 'contractions']
    };

    // ADJECTIVE ORDER (OSASCOMP)
    this.adjectiveOrder = [
      'opinion',    // beautiful, ugly
      'size',       // big, small, tall
      'age',        // old, new, young
      'shape',      // round, square
      'color',      // red, blue, green
      'origin',     // American, Chinese
      'material',   // wooden, metal, plastic
      'purpose'     // sleeping (bag), running (shoes)
    ];

    // COMMON SPELLING CORRECTIONS
    this.spellingCorrections = {
      'abot': 'about', 'abotu': 'about', 'acheive': 'achieve', 'acheived': 'achieved',
      'accomodate': 'accommodate', 'wich': 'which', 'recieve': 'receive',
      'beleive': 'believe', 'occured': 'occurred', 'goverment': 'government',
      'seperate': 'separate', 'definate': 'definite', 'definately': 'definitely',
      'untill': 'until', 'useing': 'using', 'thier': 'their', 'becuase': 'because',
      'begining': 'beginning', 'occassion': 'occasion', 'embarass': 'embarrass',
      'sucessful': 'successful', 'calender': 'calendar', 'collegue': 'colleague',
      'buisness': 'business', 'commitee': 'committee', 'concious': 'conscious',
      'disapoint': 'disappoint', 'existance': 'existence', 'experiance': 'experience',
      'foriegn': 'foreign', 'harrass': 'harass', 'independant': 'independent',
      'maintainance': 'maintenance', 'necesary': 'necessary', 'occassionally': 'occasionally',
      'persue': 'pursue', 'posession': 'possession', 'proffesional': 'professional',
      'recomend': 'recommend', 'refered': 'referred', 'relevent': 'relevant',
      'tommorow': 'tomorrow', 'whereever': 'wherever', 'wich': 'which'
    };

    // WORD CONTRACTIONS AND EXPANSIONS
    this.contractions = {
      "ain't": "am not", "aren't": "are not", "can't": "cannot",
      "couldn't": "could not", "didn't": "did not", "doesn't": "does not",
      "don't": "do not", "hadn't": "had not", "hasn't": "has not",
      "haven't": "have not", "he'd": "he would", "he'll": "he will",
      "he's": "he is", "i'd": "I would", "i'll": "I will",
      "i'm": "I am", "i've": "I have", "isn't": "is not",
      "it's": "it is", "let's": "let us", "shouldn't": "should not",
      "that's": "that is", "there's": "there is", "they'd": "they would",
      "they'll": "they will", "they're": "they are", "they've": "they have",
      "wasn't": "was not", "we'd": "we would", "we're": "we are",
      "we've": "we have", "weren't": "were not", "what's": "what is",
      "won't": "will not", "wouldn't": "would not", "you'd": "you would",
      "you'll": "you will", "you're": "you are", "you've": "you have"
    };
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
          .filter(m => {
            // Filter out problematic replacements
            if (!m.replacements || m.replacements.length === 0) return false;
            
            // Skip replacements that add periods in wrong places
            const replacement = m.replacements[0].value;
            const original = text.substring(m.offset, m.offset + m.length);
            
            // Skip if adding period after "and", "or", common words
            if (replacement.match(/^(and|or|to|at|in|on|the|a|an|my|his|her)\.$/i)) {
              return false;
            }
            
            // Skip if replacing verb with verb + period (like "was" -> "was.")
            if (original.match(/^(was|were|is|are|will|would|can|could)$/i) && 
                replacement.includes('.')) {
              return false;
            }
            
            return true;
          })
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
   * Apply comprehensive grammar rules covering ALL grammar concepts
   * @param {string} text - Text to correct
   * @returns {string} - Corrected text
   */
  applyAdvancedGrammarRules(text) {
    let corrected = text;
    
    // STEP 1: USE COMPROMISE NLP FOR INTELLIGENT GRAMMAR CORRECTION
    try {
      let doc = nlp(corrected);
      
      // Fix contractions and verb forms using NLP
      doc.contractions().expand();
      
      // Convert to proper tenses when needed
      // (compromise handles this intelligently)
      
      corrected = doc.text();
    } catch (nlpError) {
      console.log('NLP processing warning:', nlpError.message);
    }
    
    // STEP 2: SPELLING CORRECTIONS
    corrected = this.applySpellingCorrections(corrected);
    
    // STEP 3: VERB TENSE CORRECTIONS
    corrected = this.fixVerbTenses(corrected);
    
    // STEP 4: SUBJECT-VERB AGREEMENT
    corrected = this.fixSubjectVerbAgreement(corrected);
    
    // STEP 5: PRONOUN CORRECTIONS
    corrected = this.fixPronouns(corrected);
    
    // STEP 6: PREPOSITION CORRECTIONS
    corrected = this.fixPrepositions(corrected);
    
    // STEP 7: ARTICLE CORRECTIONS (a/an/the)
    corrected = this.fixArticles(corrected);
    
    // STEP 8: DOUBLE NEGATIVES
    corrected = this.fixDoubleNegatives(corrected);
    
    // STEP 9: ADJECTIVE ORDER
    corrected = this.fixAdjectiveOrder(corrected);
    
    // STEP 10: PUNCTUATION
    corrected = this.fixPunctuation(corrected);
    
    // STEP 11: SENTENCE STRUCTURE
    corrected = this.fixSentenceStructure(corrected);
    
    return corrected;
  }

  /**
   * Apply spelling corrections from dictionary
   */
  applySpellingCorrections(text) {
    let corrected = text;
    
    // Apply all spelling corrections
    for (const [wrong, right] of Object.entries(this.spellingCorrections)) {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      corrected = corrected.replace(regex, right);
    }
    
    return corrected;
  }

  /**
   * Fix verb tense issues comprehensively
   */
  fixVerbTenses(text) {
    let corrected = text;
    
    // Past tense with future time markers -> Future tense
    corrected = corrected
      .replace(/\b(was|were)\s+(\w+ing)\s+(tomorrow|next\s+\w+|later|soon|tonight|upcoming)\b/gi, 
        (match, pastVerb, presentParticiple, timeMarker) => {
          return `will be ${presentParticiple} ${timeMarker}`;
        })
      .replace(/\b(was|were)\s+going\s+to\s+(\w+)\s+(tomorrow|next\s+\w+|later|soon)\b/gi,
        (match, pastVerb, verb, timeMarker) => {
          return `will ${verb} ${timeMarker}`;
        });
    
    // Present tense with past time markers -> Past tense
    corrected = corrected
      .replace(/\b(am|is|are)\s+(\w+ing)\s+(yesterday|last\s+\w+|ago)\b/gi,
        (match, presentVerb, presentParticiple, timeMarker) => {
          return `was ${presentParticiple} ${timeMarker}`;
        });
    
    // Fix irregular verb forms with have/has/had
    for (const [base, forms] of Object.entries(this.irregularVerbs)) {
      // "has/have [past]" -> "has/have [pastParticiple]"
      const pastRegex = new RegExp(`\\b(has|have|had)\\s+${forms.past}\\b`, 'gi');
      corrected = corrected.replace(pastRegex, `$1 ${forms.pastParticiple}`);
      
      // "has/have [base]" -> "has/have [pastParticiple]" (if past context)
      const baseRegex = new RegExp(`\\b(has|have|had)\\s+${base}\\b`, 'gi');
      corrected = corrected.replace(baseRegex, `$1 ${forms.pastParticiple}`);
    }
    
    // Fix "will" + past tense -> "will" + base form
    corrected = corrected
      .replace(/\bwill\s+(\w+ed)\b/gi, (match, verb) => {
        // Try to convert past tense to base form
        const baseForm = verb.replace(/ed$/, '');
        return `will ${baseForm}`;
      });
    
    // Fix continuous tense issues
    corrected = corrected
      .replace(/\b(is|am|are|was|were)\s+(\w+ed)\b/gi, (match, auxVerb, verb) => {
        // Past participle after be -> should be present participle
        if (!verb.endsWith('ing')) {
          const baseForm = verb.replace(/ed$/, '');
          return `${auxVerb} ${baseForm}ing`;
        }
        return match;
      });
    
    return corrected;
  }

  /**
   * Fix subject-verb agreement issues
   */
  fixSubjectVerbAgreement(text) {
    let corrected = text;
    
    // Compound subjects (X and Y) -> plural verb
    corrected = corrected
      .replace(/\b(\w+)\s+and\s+(\w+)\s+was\b/gi, '$1 and $2 were')
      .replace(/\b(\w+)\s+and\s+(\w+)\s+is\b/gi, '$1 and $2 are')
      .replace(/\b(\w+)\s+and\s+(\w+)\s+has\b/gi, '$1 and $2 have');
    
    // Singular pronouns with plural verbs
    corrected = corrected
      .replace(/\b(he|she|it)\s+were\b/gi, '$1 was')
      .replace(/\b(he|she|it)\s+are\b/gi, '$1 is')
      .replace(/\b(he|she|it)\s+have\b/gi, '$1 has')
      .replace(/\b(he|she|it)\s+do\b/gi, '$1 does');
    
    // Plural pronouns with singular verbs
    corrected = corrected
      .replace(/\b(I|we|they|you)\s+was\b/gi, (match, pronoun) => {
        return pronoun.toLowerCase() === 'i' || pronoun.toLowerCase() === 'you' ? `${pronoun} was` : `${pronoun} were`;
      })
      .replace(/\b(we|they)\s+is\b/gi, '$1 are')
      .replace(/\b(we|they)\s+has\b/gi, '$1 have')
      .replace(/\b(we|they)\s+does\b/gi, '$1 do');
    
    // Special cases
    corrected = corrected
      .replace(/\bI\s+is\b/gi, 'I am')
      .replace(/\bI\s+are\b/gi, 'I am')
      .replace(/\byou\s+is\b/gi, 'you are')
      .replace(/\bI\s+has\b/gi, 'I have')
      .replace(/\byou\s+has\b/gi, 'you have');
    
    return corrected;
  }

  /**
   * Fix pronoun case issues (I/me, he/him, she/her, they/them)
   */
  fixPronouns(text) {
    let corrected = text;
    
    // Subject position (before verb)
    corrected = corrected
      .replace(/\bme\s+and\s+(\w+)\s+(am|is|are|was|were|will|would|have|has|had|do|does|did)/gi, 
        'I and $1 $2')
      .replace(/\bhim\s+and\s+(\w+)\s+(am|is|are|was|were|will|would|have|has|had|do|does|did)/gi,
        'he and $1 $2')
      .replace(/\bher\s+and\s+(\w+)\s+(am|is|are|was|were|will|would|have|has|had|do|does|did)/gi,
        'she and $1 $2')
      .replace(/\bthem\s+and\s+(\w+)\s+(am|is|are|was|were|will|would|have|has|had|do|does|did)/gi,
        'they and $1 $2');
    
    // Start of sentence
    corrected = corrected
      .replace(/\bMe\s+and\s+/g, 'I and ')
      .replace(/\bMe\s+(am|was|will|have|do)/gi, 'I $1')
      .replace(/\bHim\s+and\s+/g, 'He and ')
      .replace(/\bHer\s+and\s+(\w+)\s+/gi, (match, nextWord) => {
        // Check if it's being used as subject
        if (['are', 'were', 'will', 'have', 'do'].includes(nextWord.toLowerCase())) {
          return 'She and ';
        }
        return match; // Keep as is if possessive
      });
    
    // Object position (after verb/preposition) - I -> me
    corrected = corrected
      .replace(/\b(to|for|with|at|by|from)\s+I\b/gi, '$1 me')
      .replace(/\b(gave|told|showed|sent|brought)\s+I\b/gi, '$1 me');
    
    // Reflexive pronouns
    corrected = corrected
      .replace(/\bI\s+(myself|meself)\b/gi, 'I myself')
      .replace(/\bhimself\s+and\s+myself/gi, 'myself and himself');
    
    return corrected;
  }

  /**
   * Fix preposition usage
   */
  fixPrepositions(text) {
    let corrected = text;
    
    // Common preposition errors
    corrected = corrected
      .replace(/\bin\s+monday\b/gi, 'on Monday')
      .replace(/\bin\s+tuesday\b/gi, 'on Tuesday')
      .replace(/\bin\s+wednesday\b/gi, 'on Wednesday')
      .replace(/\bin\s+thursday\b/gi, 'on Thursday')
      .replace(/\bin\s+friday\b/gi, 'on Friday')
      .replace(/\bin\s+saturday\b/gi, 'on Saturday')
      .replace(/\bin\s+sunday\b/gi, 'on Sunday')
      .replace(/\bat\s+morning\b/gi, 'in the morning')
      .replace(/\bat\s+afternoon\b/gi, 'in the afternoon')
      .replace(/\bat\s+evening\b/gi, 'in the evening')
      .replace(/\bmarried\s+with\b/gi, 'married to')
      .replace(/\bdifferent\s+than\b/gi, 'different from')
      .replace(/\bdepend\s+on\s+it\b/gi, 'depend on it')
      .replace(/\blistening\s+music\b/gi, 'listening to music')
      .replace(/\barrived\s+to\b/gi, 'arrived at')
      .replace(/\bconsist\s+of\b/gi, 'consist of')
      .replace(/\bon\s+the\s+night\b/gi, 'at night');
    
    return corrected;
  }

  /**
   * Fix article usage (a/an/the)
   */
  fixArticles(text) {
    let corrected = text;
    
    // Fix a/an based on following word
    corrected = corrected.replace(/\ba\s+([aeiou]\w*)/gi, 'an $1');
    corrected = corrected.replace(/\ban\s+([bcdfghjklmnpqrstvwxyz]\w*)/gi, 'a $1');
    
    // Handle exceptions
    for (const word of this.articleRules.exceptions.an) {
      const regex = new RegExp(`\\ba\\s+${word}\\b`, 'gi');
      corrected = corrected.replace(regex, `an ${word}`);
    }
    for (const word of this.articleRules.exceptions.a) {
      const regex = new RegExp(`\\ban\\s+${word}\\b`, 'gi');
      corrected = corrected.replace(regex, `a ${word}`);
    }
    
    // Fix double articles
    corrected = corrected
      .replace(/\ba\s+a\b/gi, 'a')
      .replace(/\ban\s+an\b/gi, 'an')
      .replace(/\bthe\s+the\b/gi, 'the')
      .replace(/\ba\s+an\b/gi, 'an')
      .replace(/\ban\s+a\b/gi, 'a');
    
    return corrected;
  }

  /**
   * Fix double negatives
   */
  fixDoubleNegatives(text) {
    let corrected = text;
    
    corrected = corrected
      .replace(/\bdon't\s+have\s+no\b/gi, "don't have any")
      .replace(/\bdon't\s+need\s+no\b/gi, "don't need any")
      .replace(/\bdidn't\s+have\s+no\b/gi, "didn't have any")
      .replace(/\bcan't\s+get\s+no\b/gi, "can't get any")
      .replace(/\bcan't\s+see\s+no\b/gi, "can't see any")
      .replace(/\bdidn't\s+see\s+nothing\b/gi, "didn't see anything")
      .replace(/\bdidn't\s+do\s+nothing\b/gi, "didn't do anything")
      .replace(/\bwon't\s+tell\s+nobody\b/gi, "won't tell anybody")
      .replace(/\bnever\s+did\s+nothing\b/gi, "never did anything")
      .replace(/\bno\s+one\s+never\b/gi, "no one ever")
      .replace(/\bnowhere\s+to\s+go\s+no\s+more\b/gi, "nowhere to go anymore");
    
    return corrected;
  }

  /**
   * Fix adjective order (Opinion-Size-Age-Shape-Color-Origin-Material-Purpose)
   */
  fixAdjectiveOrder(text) {
    // This is complex - implement basic patterns
    let corrected = text;
    
    // Common patterns: "blue big" -> "big blue", "wooden old" -> "old wooden"
    corrected = corrected
      .replace(/\b(red|blue|green|yellow|black|white)\s+(big|small|large|tiny|huge)\b/gi, '$2 $1')
      .replace(/\b(wooden|metal|plastic|glass)\s+(old|new|ancient|modern)\b/gi, '$2 $1')
      .replace(/\b(beautiful|ugly|nice|good)\s+(big|small|large|tiny)\b/gi, '$1 $2');
    
    return corrected;
  }

  /**
   * Fix punctuation issues
   */
  fixPunctuation(text) {
    let corrected = text;
    
    // Fix spacing around punctuation
    corrected = corrected
      .replace(/\s+([,.!?;:])/g, '$1')           // Remove space before punctuation
      .replace(/([,.!?;:])([a-zA-Z])/g, '$1 $2') // Add space after punctuation
      .replace(/([,.!?])\s+([,.!?])/g, '$1$2')   // Remove space between duplicate punctuation
      .replace(/([!?]){2,}/g, '$1')               // Remove duplicate exclamation/question marks
      .replace(/\.{4,}/g, '...')                  // Max 3 dots for ellipsis
      .replace(/,{2,}/g, ',');                    // Remove duplicate commas
    
    // Fix missing punctuation at end of sentences (more selective)
    // Only if there's clear sentence boundary with capitalized word
    corrected = corrected.replace(/([a-z])\s+([A-Z][a-z]{3,})/g, (match, ending, beginning) => {
      // Skip if it's a proper noun or acronym pattern
      if (beginning.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December|Mr|Mrs|Ms|Dr)/)) {
        return match;
      }
      return `${ending}. ${beginning}`;
    });
    
    // Fix comma splices (two independent clauses with only comma)
    corrected = corrected.replace(/([a-z]),\s+(however|therefore|thus|hence|consequently)/gi, '$1; $2');
    
    // Add commas after introductory phrases
    corrected = corrected
      .replace(/^(However|Therefore|Thus|Moreover|Furthermore|Additionally|Meanwhile)(\s+[a-z])/gim, '$1,$2')
      .replace(/^(In addition|On the other hand|For example|For instance)(\s+[a-z])/gim, '$1,$2');
    
    return corrected;
  }

  /**
   * Fix sentence structure and fragments
   */
  fixSentenceStructure(text) {
    let corrected = text;
    
    // Capitalize first letter of sentences
    corrected = corrected.replace(/(^\w|[.!?]\s+\w)/g, (match) => match.toUpperCase());
    
    // Fix run-on sentences (multiple independent clauses without conjunction)
    // This is simplified - full implementation would need sentence parsing
    
    // Fix sentence fragments - add missing subject
    corrected = corrected
      .replace(/\.\s+(Was|Were|Is|Are|Will be|Has been)\s+(\w+)/gi, '. It $1 $2')
      .replace(/\.\s+(Went|Came|Left|Arrived)\s+/gi, '. They $1 ');
    
    // Fix multiple spaces and newlines
    corrected = corrected
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
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
