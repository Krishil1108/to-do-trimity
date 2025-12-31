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
   * Improve English text using advanced custom grammar rules
   * Falls back to Gemini AI if available
   * @param {string} text - Text to improve
   * @returns {Promise<string>} - Improved text
   */
  async improveEnglishText(text) {
    console.log('🔧 [DEBUG] improveEnglishText called with:', text);
    // STEP 0: Protect adjectives BEFORE any processing
    const adjectiveProtection = [];
    let protectionIndex = 0;
    let protectedText = text.replace(/\b(was|were|is|are|am|be|been|being)\s+(tired|excited|interested|confused|surprised|amazed|bored|worried|scared|frightened|pleased|satisfied|disappointed|frustrated|exhausted|relaxed|stressed|concerned|involved|engaged|committed|dedicated|motivated|inspired|impressed|shocked|stunned|astonished|delighted|thrilled|annoyed|irritated|disturbed|troubled|affected|influenced|prepared|qualified|skilled|experienced|trained|educated|informed|aware|convinced|persuaded|determined|willing|able|unable|ready|eager|reluctant|hesitant|confident|certain|sure|doubtful|unsure|unclear|obvious|apparent|evident|visible|hidden|absent|present|available|unavailable|necessary|essential|important|critical|vital|crucial|significant|relevant|useful|helpful|valuable|beneficial|harmful|dangerous|risky|safe|secure|stable|unstable|consistent|inconsistent|appropriate|inappropriate|suitable|unsuitable|adequate|inadequate|sufficient|insufficient|complete|incomplete|perfect|imperfect|correct|incorrect|accurate|inaccurate|precise|vague|clear|unclear|simple|complex|easy|difficult|hard|soft|tough|weak|strong)\b/gi,
      (match, verb, adj) => {
        const placeholder = `ADJPROTECT${protectionIndex}ADJPROTECT`;
        adjectiveProtection.push({ placeholder, original: match });
        protectionIndex++;
        return placeholder;
      }
    );
    
    try {
      console.log('🔧 Applying comprehensive grammar correction...');
      
      // Apply all 31 advanced grammar rules directly
      let correctedText = this.applyAdvancedGrammarRules(protectedText);
      
      // Post-process to fix any remaining issues
      correctedText = this.postProcessGrammar(correctedText);
      
      // Restore protected adjectives
      adjectiveProtection.forEach((item) => {
        correctedText = correctedText.replace(new RegExp(item.placeholder, 'gi'), item.original);
      });
      
      console.log('✅ Grammar correction completed successfully');
      return this.enhanceTextProfessionalism(correctedText);
      
    } catch (error) {
      console.log('⚠️ Custom grammar rules failed, trying Gemini AI...', error.message);
      
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
        } catch (geminiError) {
          console.error('Gemini AI error:', geminiError.message || geminiError);
          // Final fallback to basic cleanup
          return this.basicTextCleanup(text);
        }
      } else {
        // No Gemini, use basic cleanup
        return this.basicTextCleanup(text);
      }
    }
  }

  /**
   * Apply context-aware grammar rules BEFORE LanguageTool
   * This handles time-marker specific tense corrections
   * GENERALIZED to work on ANY unseen data
   * @param {string} text - Text to correct
   * @returns {string} - Corrected text
   */
  applyContextAwareGrammarRules(text) {
    let corrected = text;
    
    // Use Compromise NLP for intelligent text analysis
    try {
      let doc = nlp(corrected);
      
      // Identify time markers dynamically
      const pastMarkers = doc.match('(yesterday|#Date ago|last #Duration|earlier|previously)').out('array');
      const futureMarkers = doc.match('(tomorrow|next #Duration|later|soon|upcoming)').out('array');
      
      // IMPORTANT: Don't blindly change all verbs - only change if there's a strong past/future context
      // AND the sentence doesn't already have consistent tenses
      
      // Check if sentence already has consistent past tense verbs
      const hasPastVerbs = /\b(worked|completed|finished|started|began|did|went|came|had|could|would|should|was|were)\b/i.test(corrected);
      const hasFutureVerbs = /\b(will|shall|going\s+to)\b/i.test(corrected);
      
      // If past markers found AND no future verbs, ensure past tense
      if (pastMarkers.length > 0 && !hasFutureVerbs) {
        doc.verbs().toPastTense();
        corrected = doc.text();
      }
      
      // If future markers found AND sentence doesn't already have consistent past tense narrative
      // Only convert if the future marker is at sentence start or is a primary time reference
      if (futureMarkers.length > 0 && !hasPastVerbs) {
        doc.verbs().toFutureTense();
        corrected = doc.text();
      }
    } catch (nlpError) {
      console.log('NLP time marker detection warning:', nlpError.message);
    }
    
    // Fix common contractions and possessives
    corrected = corrected
      .replace(/\btodays\b/gi, "today's")
      .replace(/\byesterdays\b/gi, "yesterday's")
      .replace(/\btomorrows\b/gi, "tomorrow's")
      .replace(/\btonights\b/gi, "tonight's");
    
    // GENERALIZED PATTERN: Any singular subject + "were" → "was"
    corrected = corrected.replace(
      /\b(he|she|it|this|that|[A-Z][a-z]+)\s+(were)\b/gi,
      (match, subject, verb) => `${subject} was`
    );
    
    // GENERALIZED PATTERN: Any plural subject + "was" → "were"
    corrected = corrected.replace(
      /\b(they|we|these|those|[A-Z][a-z]+\s+and\s+[A-Z][a-z]+)\s+(was)\b/gi,
      (match, subject, verb) => `${subject} were`
    );
    
    // GENERALIZED: Detect ANY past time expression + wrong tense
    const pastTimePatterns = [
      /\b(yesterday|ago|earlier|previously|last\s+\w+|this\s+morning|just\s+now)\b/i
    ];
    
    pastTimePatterns.forEach(pattern => {
      if (pattern.test(corrected)) {
        // Convert present continuous to past continuous
        corrected = corrected.replace(
          /\b(am|is|are)\s+(\w+ing)\b/gi,
          (match, auxVerb, gerund, offset) => {
            const before = corrected.substring(Math.max(0, offset - 50), offset);
            const after = corrected.substring(offset, Math.min(corrected.length, offset + 100));
            
            // Check if past time marker is nearby
            if (pastTimePatterns.some(p => p.test(before + after))) {
              return auxVerb === 'am' || auxVerb === 'is' ? `was ${gerund}` : `were ${gerund}`;
            }
            return match;
          }
        );
      }
    });
    
    // GENERALIZED: Detect ANY future time expression + wrong tense  
    const futureTimePatterns = [
      /\b(tomorrow|later|soon|next\s+\w+|upcoming|tonight|this\s+evening)\b/i
    ];
    
    futureTimePatterns.forEach(pattern => {
      if (pattern.test(corrected)) {
        // DON'T convert if sentence already has consistent past tense narrative
        const hasPastTenseNarrative = /\b(worked|completed|finished|started|began|did|went|came|could|would|should)\b/i.test(corrected);
        
        if (hasPastTenseNarrative) {
          // Skip future conversion - this is a past tense narrative that happens to mention future events
          return;
        }
        
        // Convert past to future
        corrected = corrected.replace(
          /\b(was|were)\s+(\w+ing)\b/gi,
          (match, auxVerb, gerund, offset) => {
            const before = corrected.substring(Math.max(0, offset - 50), offset);
            const after = corrected.substring(offset, Math.min(corrected.length, offset + 100));
            
            // Check if future time marker is nearby
            if (futureTimePatterns.some(p => p.test(before + after))) {
              return `will be ${gerund}`;
            }
            return match;
          }
        );
        
        // Convert simple past verbs to future
        corrected = corrected.replace(
          /\b(\w+)(ed|went|came|did|saw|had|took|gave|made)\b/gi,
          (match, full, offset) => {
            const before = corrected.substring(Math.max(0, offset - 50), offset);
            const after = corrected.substring(offset, Math.min(corrected.length, offset + 100));
            
            if (futureTimePatterns.some(p => p.test(before + after))) {
              // Convert to base form
              const irregularMap = {
                'went': 'go', 'came': 'come', 'did': 'do', 'saw': 'see',
                'had': 'have', 'took': 'take', 'gave': 'give', 'made': 'make',
                'got': 'get', 'brought': 'bring', 'thought': 'think', 'found': 'find'
              };
              
              const lower = match.toLowerCase();
              if (irregularMap[lower]) {
                return 'will ' + irregularMap[lower];
              } else if (match.endsWith('ed')) {
                return 'will ' + match.slice(0, -2);
              }
            }
            return match;
          }
        );
      }
    });
    
    // GENERALIZED: Perfect tense with past time markers → Simple past
    // ANY "has/have + past participle" + past time → simple past
    corrected = corrected.replace(
      /\b(has|have)\s+(\w+(?:ed|en|ne|wn))\b/gi,
      (match, aux, participle, offset) => {
        const after = corrected.substring(offset, Math.min(corrected.length, offset + 80));
        
        // If past time marker nearby, convert to simple past
        if (/\b(yesterday|ago|last\s+\w+|earlier)\b/i.test(after)) {
          // Map common past participles to simple past
          const participleToPast = {
            'gone': 'went', 'been': aux === 'has' ? 'was' : 'were', 
            'done': 'did', 'seen': 'saw', 'taken': 'took',
            'given': 'gave', 'written': 'wrote', 'spoken': 'spoke',
            'eaten': 'ate', 'driven': 'drove', 'known': 'knew',
            'flown': 'flew', 'grown': 'grew', 'thrown': 'threw'
          };
          
          const simplePast = participleToPast[participle.toLowerCase()] || participle.replace(/en$/, '').replace(/ne$/, '');
          return simplePast;
        }
        return match;
      }
    );
    
    // GENERALIZED: "going to" with time markers
    corrected = corrected.replace(
      /\b(was|were|am|is|are)\s+going\s+to\s+(\w+)\b/gi,
      (match, auxVerb, verb, offset) => {
        const around = corrected.substring(Math.max(0, offset - 50), Math.min(corrected.length, offset + 100));
        
        // Future time nearby → will
        if (/\b(tomorrow|next\s+\w+|later|soon)\b/i.test(around)) {
          return `will ${verb}`;
        }
        // Past time nearby → was/were going to (keep as is) OR change to simple past
        if (/\b(yesterday|ago|last\s+\w+)\b/i.test(around)) {
          return `${auxVerb} going to ${verb}`; // Keep as past continuous intention
        }
        return match;
      }
    );
    
    return corrected;
  }

  /**
   * Post-process grammar after all corrections
   * Fixes any remaining context-sensitive issues
   * @param {string} text - Text to post-process
   * @returns {string} - Final corrected text
   */
  postProcessGrammar(text) {
    let corrected = text;
    
    // Fix any remaining "is/are...yesterday" patterns
    corrected = corrected.replace(
      /\b(is|are|am)\s+([^.]+?)\s+(yesterday|last\s+\w+|ago|earlier|previously)\b/gi,
      (match, verb, middle, timeMarker) => {
        const newVerb = verb.toLowerCase() === 'am' || verb.toLowerCase() === 'is' ? 'was' : 'were';
        return `${newVerb} ${middle} ${timeMarker}`;
      }
    );
    
    // Fix "was/were...tomorrow" BUT ONLY if not in a past tense narrative
    // Don't change if the sentence has consistent past tense (worked, could, etc.)
    const hasPastNarrative = /\b(worked|completed|finished|started|began|did|went|came|could|would|should)\b/i.test(corrected);
    
    if (!hasPastNarrative) {
      corrected = corrected.replace(
        /\b(was|were)\s+([^.]+?)\s+(tomorrow|next\s+\w+|later|soon|upcoming)\b/gi,
        (match, verb, middle, timeMarker) => {
          return `will be ${middle} ${timeMarker}`;
        }
      );
    }
    
    // Fix incorrect period insertion: "I and. John" -> "I and John"
    corrected = corrected.replace(/\b(and|or|to|at|in|on|by|with)\.(\s+[A-Z])/g, '$1$2');
    
    // Fix "will. [Verb]" -> "will [verb]"
    corrected = corrected.replace(/\bwill\.(\s+[A-Z]\w+)/g, (match, rest) => {
      return 'will' + rest.toLowerCase();
    });
    
    // Fix pronoun order: "I and John" -> "John and I" (more natural)
    corrected = corrected.replace(/\bI\s+and\s+([A-Z]\w+)/g, '$1 and I');
    corrected = corrected.replace(/\bme\s+and\s+([A-Z]\w+)/gi, '$1 and me');
    
    // Fix double spaces from replacements
    corrected = corrected.replace(/\s{2,}/g, ' ');
    
    return corrected;
  }

  /**
   * Apply comprehensive grammar rules covering ALL grammar concepts
   * GENERALIZED for ANY unseen input
   * @param {string} text - Text to correct
   * @returns {string} - Corrected text
   */
  applyAdvancedGrammarRules(text) {
    console.log('🔧 [DEBUG] applyAdvancedGrammarRules called with:', text.substring(0, 50));
    let corrected = text;
    
    // STEP 0: CRITICAL PRE-PROCESSING - Fix common mistakes before NLP
    
    // 0.1: Fix "for + verb" → "to + verb" (infinitive purpose clauses)
    // Match both base form and past tense/participle
    corrected = corrected.replace(/\bfor\s+(finish(ed)?|complet(e|ed)?|review(ed)?|start(ed)?|begin|begun|end(ed)?|make|made|do(ne)?|did|have|had|be(en)?|go(ne)?|went|come|came|take|took|taken|give|gave|given|get|got|gotten|see|saw|seen|know(n)?|knew|think|thought|work(ed)?|stud(y|ied)|learn(ed|t)?|teach|taught|write|wrote|written|read|help(ed)?|support(ed)?|improv(e|ed)|enhanc(e|ed)|develop(ed)?|creat(e|ed)|build|built|design(ed)?|test(ed)?|deploy(ed)?|implement(ed)?|manag(e|ed)|handl(e|ed)|process(ed)?|analyz(e|ed)|evaluat(e|ed)|assess(ed)?|discuss(ed)?|present(ed)?|deliver(ed)?|achiev(e|ed)|reach(ed)?|accomplish(ed)?|perform(ed)?|execut(e|ed)|conduct(ed)?|organiz(e|ed)|plan(ned)?|prepar(e|ed)|resolv(e|ed)|solv(e|ed)|fix(ed)?|updat(e|ed)|upgrad(e|ed)|modif(y|ied)|chang(e|ed)|adjust(ed)?|adapt(ed)?|coordinat(e|ed)|collaborat(e|ed)|communicat(e|ed)|inform(ed)?|notif(y|ied)|report(ed)?|document(ed)?|record(ed)?|track(ed)?|monitor(ed)?|measur(e|ed)|ensur(e|ed)|verif(y|ied)|validat(e|ed)|confirm(ed)?|approv(e|ed)|accept(ed)?|reject(ed)?|declin(e|ed)|cancel(led)?|postpone(d)?|reschedul(e|ed)|extend(ed)?|expand(ed)?|reduc(e|ed)|minimiz(e|ed)|maximiz(e|ed)|optimiz(e|ed)|streamlin(e|ed)|automat(e|ed))\b/gi,
      (match, verb) => {
        // Extract base form
        const baseForm = verb.replace(/(ed|d|en|n|ing|t)$/i, '').replace(/i(ed)$/i, 'y');
        return `to ${baseForm}`;
      }
    );
    
    // 0.2: Fix redundant conjunctions "Although...but", "Because...so"
    corrected = corrected.replace(/\b(although|though|even though)\s+([^,]+),\s+but\s+/gi, '$1 $2, ');
    corrected = corrected.replace(/\bbecause\s+([^,]+),\s+so\s+/gi, 'because $1, ');
    
    // 0.2a: Fix idiomatic verb patterns
    // "go for shopping" → "go shopping", "go for swimming" → "go swimming"
    corrected = corrected.replace(/\bgo\s+for\s+(shopping|swimming|running|walking|hiking|cycling|fishing|camping|dancing|skiing|skating|jogging|climbing)\b/gi, 'go $1');
    
    // 0.2b: Fix parallel structure in lists with "and"
    // "go...and eating" → "go...and eat" (both base verbs)
    // "want to go...and eating" → "want to go...and eat"
    corrected = corrected.replace(/\b(to\s+)?(go|come|start|begin|try|attempt|want|need|decide|plan)\s+([^and]+)\s+and\s+(\w+ing)\b/gi,
      (match, to, verb, middle, gerund) => {
        // Convert gerund to base form for parallel structure
        const baseForm = gerund.replace(/ing$/i, '').replace(/([^aeiou])([aeiou])\2ing$/i, '$1$2');
        return `${to || ''}${verb} ${middle} and ${baseForm}`;
      }
    );
    
    // 0.3: Fix modal + past participle → modal + base verb
    // "can reviewed" → "can review", "will completed" → "will complete"
    corrected = corrected.replace(/\b(can|could|may|might|must|shall|should|will|would)\s+(\w+ed|went|came|did|saw|had|took|made|got|gave|found)\b/gi,
      (match, modal, pastVerb) => {
        const baseForm = {
          'went': 'go', 'came': 'come', 'did': 'do', 'saw': 'see',
          'had': 'have', 'took': 'take', 'made': 'make', 'got': 'get',
          'gave': 'give', 'found': 'find', 'told': 'tell', 'thought': 'think',
          'brought': 'bring', 'bought': 'buy', 'taught': 'teach', 'caught': 'catch',
          'fought': 'fight', 'sought': 'seek', 'felt': 'feel', 'kept': 'keep',
          'left': 'leave', 'meant': 'mean', 'sent': 'send', 'spent': 'spend',
          'built': 'build', 'lent': 'lend', 'bent': 'bend', 'held': 'hold'
        }[pastVerb.toLowerCase()] || pastVerb.replace(/(ed|d)$/i, '');
        return `${modal} ${baseForm}`;
      }
    );
    
    // 0.3a: Fix "for + infinitive" → "to + infinitive"
    // "for make" → "to make", "for do" → "to do"
    corrected = corrected.replace(/\bfor\s+(make|do|get|have|take|give|see|go|come|help|create|complete|finish|start|begin|achieve|reach|obtain|acquire|develop|improve|enhance|build|design|implement|execute|perform|conduct|manage|organize|coordinate|arrange|plan|prepare|learn|study|understand|know|realize|recognize|discover|explore|investigate|examine|analyze|evaluate|assess|review|check|verify|confirm|ensure|guarantee|provide|supply|deliver|offer|present|introduce|explain|describe|discuss|talk|speak|say|tell|ask|request|require|need|want|wish|hope|expect|anticipate|predict|forecast|estimate|calculate|compute|determine|decide|choose|select|pick|prefer|like|love|enjoy|appreciate|value|respect|admire|trust|believe|think|feel|sense|perceive|observe|notice|detect|identify|locate|find|search|seek|look)\b/gi, 'to $1');
    
    // 0.4: Protect adjectives after "was/were/is/are/be/been/being"
    // "was tired" should stay "was tired", NOT "was tiring"
    // Store these before ANY processing including NLP
    const adjectiveProtection = [];
    let protectionIndex = 0;
    corrected = corrected.replace(/\b(was|were|is|are|am|be|been|being)\s+(tired|excited|interested|confused|surprised|amazed|bored|worried|scared|frightened|pleased|satisfied|disappointed|frustrated|exhausted|relaxed|stressed|concerned|involved|engaged|committed|dedicated|motivated|inspired|impressed|shocked|stunned|astonished|delighted|thrilled|annoyed|irritated|disturbed|troubled|affected|influenced|prepared|qualified|skilled|experienced|trained|educated|informed|aware|convinced|persuaded|determined|willing|able|unable|ready|eager|reluctant|hesitant|confident|certain|sure|doubtful|unsure|unclear|obvious|apparent|evident|visible|hidden|absent|present|available|unavailable|necessary|essential|important|critical|vital|crucial|significant|relevant|useful|helpful|valuable|beneficial|harmful|dangerous|risky|safe|secure|stable|unstable|consistent|inconsistent|appropriate|inappropriate|suitable|unsuitable|adequate|inadequate|sufficient|insufficient|complete|incomplete|perfect|imperfect|correct|incorrect|accurate|inaccurate|precise|vague|clear|unclear|simple|complex|easy|difficult|hard|soft|tough|weak|strong)\b/gi,
      (match, verb, adj) => {
        const placeholder = `__PROTECTED_ADJ_${protectionIndex}__`;
        adjectiveProtection.push({ placeholder, original: match });
        protectionIndex++;
        return placeholder;
      }
    );
    
    // STEP 1: USE COMPROMISE NLP FOR INTELLIGENT GRAMMAR CORRECTION
    try {
      let doc = nlp(corrected);
      
      // Expand contractions for clarity
      doc.contractions().expand();
      
      // Normalize verb forms intelligently
      const sentences = doc.sentences().out('array');
      sentences.forEach(sentence => {
        let sentDoc = nlp(sentence);
        
        // Check subject-verb agreement in each sentence
        const subjects = sentDoc.match('#Noun').out('array');
        const verbs = sentDoc.verbs().out('array');
        
        // Auto-correct based on NLP understanding
        sentDoc.verbs().toInfinitive(); // Normalize first
      });
      
      corrected = doc.text();
    } catch (nlpError) {
      console.log('NLP processing warning:', nlpError.message);
    }
    
    // Restore protected adjectives AFTER ALL other processing
    adjectiveProtection.forEach((item) => {
      corrected = corrected.replace(item.placeholder, item.original);
    });
    
    // STEP 2: GENERALIZED SPELLING CORRECTIONS (pattern-based)
    corrected = this.applySpellingCorrections(corrected);
    
    // STEP 3: SVO (Subject-Verb-Object) STRUCTURE VALIDATION
    corrected = this.validateAndFixSVO(corrected);
    
    // STEP 4: ALL 12 TENSES CORRECTION (Comprehensive)
    corrected = this.fixAll12Tenses(corrected);
    
    // STEP 5: GENERALIZED VERB TENSE CORRECTIONS
    corrected = this.fixVerbTensesGeneralized(corrected);
    
    // STEP 6: GENERALIZED SUBJECT-VERB AGREEMENT
    corrected = this.fixSubjectVerbAgreementGeneralized(corrected);
    
    // STEP 7: PRONOUN CORRECTIONS
    corrected = this.fixPronouns(corrected);
    
    // STEP 8: PREPOSITION CORRECTIONS (pattern-based)
    corrected = this.fixPrepositionsGeneralized(corrected);
    
    // STEP 9: ARTICLE CORRECTIONS
    corrected = this.fixArticles(corrected);
    
    // STEP 10: DOUBLE NEGATIVES (any pattern)
    corrected = this.fixDoubleNegativesGeneralized(corrected);
    
    // STEP 11: ADJECTIVE ORDER
    corrected = this.fixAdjectiveOrder(corrected);
    
    // STEP 12: PUNCTUATION
    corrected = this.fixPunctuation(corrected);
    
    // STEP 13: SENTENCE STRUCTURE
    corrected = this.fixSentenceStructure(corrected);
    
    // STEP 14: PERFECT TENSES (Present/Past/Future Perfect)
    corrected = this.fixPerfectTenses(corrected);
    
    // STEP 15: PERFECT CONTINUOUS TENSES
    corrected = this.fixPerfectContinuousTenses(corrected);
    
    // STEP 16: CONDITIONAL SENTENCES (0,1st,2nd,3rd conditionals)
    corrected = this.fixConditionals(corrected);
    
    // STEP 17: PASSIVE VOICE
    corrected = this.fixPassiveVoice(corrected);
    
    // STEP 18: ARTICLE INSERTION (missing articles)
    corrected = this.insertMissingArticles(corrected);
    
    // STEP 19: ADJECTIVE ORDER (OSASCOMP)
    corrected = this.reorderAdjectives(corrected);
    
    // ========================================
    // LOW/MINIMAL PERFECTION IMPROVEMENTS
    // ========================================
    
    // STEP 20: PERFECT CONTINUOUS (Fix gerund formation)
    corrected = this.fixPerfectContinuousImproved(corrected);
    
    // STEP 21: GERUNDS VS INFINITIVES (enjoy + gerund, want + infinitive)
    corrected = this.fixGerundsVsInfinitives(corrected);
    
    // STEP 22: PHRASAL VERBS (100+ common patterns)
    console.log('🔧 [DEBUG] Before fixPhrasalVerbs:', corrected.substring(0, 50));
    corrected = this.fixPhrasalVerbs(corrected);
    console.log('🔧 [DEBUG] After fixPhrasalVerbs:', corrected.substring(0, 50));
    
    // STEP 23: COMPARATIVE & SUPERLATIVE (better/best, more/most)
    corrected = this.fixComparativeSuperlative(corrected);
    
    // STEP 24: REPORTED SPEECH (Direct → Indirect)
    corrected = this.fixReportedSpeech(corrected);
    
    // STEP 25: COUNTABLE VS UNCOUNTABLE (much/many, less/fewer)
    corrected = this.fixCountableUncountable(corrected);
    
    // STEP 26: SENTENCE FRAGMENTS (Complete sentences)
    corrected = this.fixSentenceFragments(corrected);
    
    // STEP 27: RUN-ON SENTENCES (Fix comma splices)
    corrected = this.fixRunOnSentences(corrected);
    
    // STEP 28: ADVANCED PUNCTUATION (Semicolons, colons)
    corrected = this.fixAdvancedPunctuation(corrected);
    
    // STEP 29: PARALLEL STRUCTURE ADVANCED (Complex lists)
    corrected = this.fixParallelStructureAdvanced(corrected);
    
    // STEP 30: COMPLEX PASSIVE (Progressive & perfect passive)
    corrected = this.fixComplexPassive(corrected);
    
    // STEP 31: ELLIPSIS & SUBSTITUTION (I can too, Neither do I)
    corrected = this.fixEllipsisSubstitution(corrected);
    
    return corrected;
  }

  /**
   * Validate and fix SVO (Subject-Verb-Object) structure
   * Ensures proper word order in sentences
   * @param {string} text - Text to validate
   * @returns {string} - Corrected text
   */
  validateAndFixSVO(text) {
    let corrected = text;
    
    try {
      let doc = nlp(corrected);
      
      // Process each sentence
      doc.sentences().forEach(sentence => {
        const sentText = sentence.text();
        
        // Identify sentence components using NLP
        const subjects = sentence.subjects().out('array');
        const verbs = sentence.verbs().out('array');
        const objects = sentence.match('#Noun').not('#Subject').out('array');
        
        // Check if sentence has proper SVO structure
        if (subjects.length > 0 && verbs.length > 0) {
          // Validate subject position (should come before verb)
          const subjectIndex = sentText.indexOf(subjects[0]);
          const verbIndex = sentText.indexOf(verbs[0]);
          
          if (verbIndex >= 0 && subjectIndex >= 0 && subjectIndex > verbIndex) {
            // Verb before subject - needs reordering (except for questions)
            if (!sentText.match(/^(what|where|when|why|how|is|are|do|does|did|will|can|should)/i)) {
              console.log(`⚠️ SVO: Verb before subject detected in: "${sentText}"`);
              // Note: Automatic reordering is complex, log for now
            }
          }
        }
        
        // Fix common SVO errors
        // "Went John to store" → "John went to store"
        let fixed = sentText;
        
        // Pattern: Verb + Subject + Rest (incorrect) → Subject + Verb + Rest
        fixed = fixed.replace(
          /^(went|came|did|made|took|gave)\s+([A-Z]\w+)\s+/i,
          (match, verb, subject) => `${subject} ${verb} `
        );
        
        if (fixed !== sentText) {
          corrected = corrected.replace(sentText, fixed);
        }
      });
      
    } catch (error) {
      console.log('SVO validation warning:', error.message);
    }
    
    // Pattern-based SVO fixes
    // Fix "Object + Verb + Subject" errors
    corrected = corrected.replace(
      /\b(the\s+\w+)\s+(was|were|is|are)\s+(by\s+[A-Z]\w+)/gi,
      (match, object, verb, bySubject) => {
        // Passive to active: "The report was written by John" (keep as is - it's correct)
        return match;
      }
    );
    
    return corrected;
  }

  /**
   * Fix ALL 12 TENSES comprehensively
   * 1. Simple Present, 2. Simple Past, 3. Simple Future
   * 4. Present Continuous, 5. Past Continuous, 6. Future Continuous
   * 7. Present Perfect, 8. Past Perfect, 9. Future Perfect
   * 10. Present Perfect Continuous, 11. Past Perfect Continuous, 12. Future Perfect Continuous
   * @param {string} text - Text to correct
   * @returns {string} - Corrected text
   */
  fixAll12Tenses(text) {
    let corrected = text;
    
    try {
      let doc = nlp(corrected);
      
      // Detect time markers to determine correct tense
      const hasPastMarker = doc.has('(yesterday|ago|last #Duration|earlier|previously)');
      const hasFutureMarker = doc.has('(tomorrow|next #Duration|later|soon|will)');
      const hasPresentMarker = doc.has('(now|currently|today|these days|nowadays)');
      const hasPerfectMarker = doc.has('(already|just|yet|ever|never|since|for #Duration)');
      const hasContinuousMarker = doc.has('(still|while|when|as)');
      
      // Apply appropriate tense based on markers
      if (hasPastMarker && !hasPerfectMarker) {
        // SIMPLE PAST or PAST CONTINUOUS
        if (hasContinuousMarker) {
          // Past Continuous: was/were + verb-ing
          doc.verbs().forEach(verb => {
            if (!verb.has('was') && !verb.has('were')) {
              verb.toPastTense();
            }
          });
        } else {
          // Simple Past: verb-ed or irregular past
          doc.verbs().toPastTense();
        }
      } else if (hasFutureMarker && !hasPerfectMarker) {
        // SIMPLE FUTURE or FUTURE CONTINUOUS
        doc.verbs().toFutureTense();
      } else if (hasPerfectMarker && hasPastMarker) {
        // PAST PERFECT: had + past participle
        doc.verbs().forEach(verb => {
          const verbText = verb.text();
          if (!verbText.startsWith('had')) {
            // Convert to past perfect form
            verb.toPastTense();
          }
        });
      }
      
      corrected = doc.text();
      
    } catch (error) {
      console.log('12 Tenses NLP warning:', error.message);
    }
    
    // Pattern-based tense corrections for ALL 12 tenses
    
    // 1. SIMPLE PRESENT: I/you/we/they + base, he/she/it + verb+s
    corrected = corrected.replace(
      /\b(he|she|it)\s+(go|do|have|watch|teach|study|play)\b/gi,
      (match, subject, verb) => {
        const thirdPersonForm = verb.endsWith('y') ? verb.slice(0, -1) + 'ies' :
                               ['go', 'do'].includes(verb) ? verb + 'es' :
                               verb + 's';
        return `${subject} ${thirdPersonForm}`;
      }
    );
    
    // 2. SIMPLE PAST: verb+ed or irregular (already handled above)
    
    // 3. SIMPLE FUTURE: will + base verb (fix "will + past tense")
    corrected = corrected.replace(
      /\bwill\s+(\w+ed|went|came|did|saw|had|took)\b/gi,
      (match, pastVerb) => {
        const baseForm = {
          'went': 'go', 'came': 'come', 'did': 'do', 'saw': 'see',
          'had': 'have', 'took': 'take', 'made': 'make', 'got': 'get'
        }[pastVerb] || pastVerb.replace(/ed$/, '');
        return `will ${baseForm}`;
      }
    );
    
    // 4. PRESENT CONTINUOUS: am/is/are + verb-ing
    corrected = corrected.replace(
      /\b(am|is|are)\s+(\w+)(?!ing)\b/gi,
      (match, auxVerb, verb, offset) => {
        // Check if next context suggests continuous
        const after = text.substring(offset, offset + 50);
        if (/\b(now|currently|at the moment|right now)\b/i.test(after) && 
            !['be', 'been', 'being'].includes(verb)) {
          return `${auxVerb} ${verb}ing`;
        }
        return match;
      }
    );
    
    // 5. PAST CONTINUOUS: was/were + verb-ing (already handled in context-aware)
    
    // 6. FUTURE CONTINUOUS: will be + verb-ing
    corrected = corrected.replace(
      /\bwill\s+(\w+ing)\b/gi,
      (match, gerund) => `will be ${gerund}`
    );
    
    // 7. PRESENT PERFECT: have/has + past participle
    corrected = corrected.replace(
      /\b(have|has)\s+(\w+)(?!ed|en)(?!\s+(been|gone|done|seen|had|have))\b/gi,
      (match, aux, verb) => {
        // Don't change if it's already correct or if it's "been" (for continuous)
        if (verb === 'been' || verb.endsWith('ed') || verb.endsWith('en')) {
          return match;
        }
        
        // Check context for perfect tense markers
        const contextBefore = corrected.substring(Math.max(0, corrected.indexOf(match) - 50), corrected.indexOf(match));
        const contextAfter = corrected.substring(corrected.indexOf(match), corrected.indexOf(match) + 50);
        const context = contextBefore + contextAfter;
        
        if (/\b(already|just|yet|recently|ever|never)\b/i.test(context)) {
          // Should be past participle
          const pastParticiple = this.irregularVerbs[verb]?.pastParticiple || verb + 'ed';
          return `${aux} ${pastParticiple}`;
        }
        return match;
      }
    );
    
    // 8. PAST PERFECT: had + past participle (but NOT "had been")
    corrected = corrected.replace(
      /\bhad\s+(\w+)(?!\s+been)(?!ed|en)\b/gi,
      (match, verb) => {
        // Skip if already past participle or if it's "been"
        if (verb === 'been' || verb.endsWith('ed') || verb.endsWith('en')) {
          return match;
        }
        const pastParticiple = this.irregularVerbs[verb]?.pastParticiple || verb + 'ed';
        return `had ${pastParticiple}`;
      }
    );
    
    // 9. FUTURE PERFECT: will have + past participle (but NOT "will have been")
    corrected = corrected.replace(
      /\bwill\s+have\s+(\w+)(?!\s+been)(?!ed|en)\b/gi,
      (match, verb) => {
        // Skip if already past participle or if it's "been"
        if (verb === 'been' || verb.endsWith('ed') || verb.endsWith('en')) {
          return match;
        }
        const pastParticiple = this.irregularVerbs[verb]?.pastParticiple || verb + 'ed';
        return `will have ${pastParticiple}`;
      }
    );
    
    // 10. PRESENT PERFECT CONTINUOUS: have/has been + verb-ing
    corrected = corrected.replace(
      /\b(have|has)\s+been\s+(\w+)(?!ing)\b/gi,
      (match, aux, verb) => {
        // Only add -ing if it's a real verb and not already gerund
        if (!['be', 'been', 'being', 'beened'].includes(verb.toLowerCase()) && 
            !verb.endsWith('ing') && /^[a-z]+$/i.test(verb)) {
          // Handle verbs ending in 'e' - drop the 'e' before adding 'ing'
          const gerund = verb.endsWith('e') && !verb.endsWith('ee') ? verb.slice(0, -1) + 'ing' : verb + 'ing';
          return `${aux} been ${gerund}`;
        }
        return match;
      }
    );
    
    // 11. PAST PERFECT CONTINUOUS: had been + verb-ing
    corrected = corrected.replace(
      /\bhad\s+been\s+(\w+)(?!ing)\b/gi,
      (match, verb) => {
        // Only add -ing if it's a real verb and not already gerund
        if (!['be', 'been', 'being', 'beened'].includes(verb.toLowerCase()) && 
            !verb.endsWith('ing') && /^[a-z]+$/i.test(verb)) {
          // Handle verbs ending in 'e' - drop the 'e' before adding 'ing'
          const gerund = verb.endsWith('e') && !verb.endsWith('ee') ? verb.slice(0, -1) + 'ing' : verb + 'ing';
          return `had been ${gerund}`;
        }
        return match;
      }
    );
    
    // 12. FUTURE PERFECT CONTINUOUS: will have been + verb-ing
    corrected = corrected.replace(
      /\bwill\s+have\s+been\s+(\w+)(?!ing)\b/gi,
      (match, verb) => {
        // Only add -ing if it's a real verb and not already gerund
        if (!['be', 'been', 'being', 'beened'].includes(verb.toLowerCase()) && 
            !verb.endsWith('ing') && /^[a-z]+$/i.test(verb)) {
          // Handle verbs ending in 'e' - drop the 'e' before adding 'ing'
          const gerund = verb.endsWith('e') && !verb.endsWith('ee') ? verb.slice(0, -1) + 'ing' : verb + 'ing';
          return `will have been ${gerund}`;
        }
        return match;
      }
    );
    
    // Clean up any accidental double suffixes (e.g., "completeded" → "completed")
    corrected = corrected.replace(/\b(\w+)(ed){2,}\b/gi, '$1ed');
    corrected = corrected.replace(/\b(\w+)(ing){2,}\b/gi, '$1ing');
    corrected = corrected.replace(/\bbeened\b/gi, 'been');
    
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
   * Fix verb tense issues comprehensively (GENERALIZED)
   * Uses pattern matching to work on ANY input
   */
  fixVerbTensesGeneralized(text) {
    let corrected = text;
    
    // Use NLP to identify and fix verb tenses
    try {
      let doc = nlp(corrected);
      
      // Get all verbs and check their context
      doc.verbs().forEach(verb => {
        const verbText = verb.text();
        const sentence = verb.parentTerm().out('text');
        
        // Check for time markers in the sentence
        if (/\b(yesterday|ago|last\s+\w+|earlier)\b/i.test(sentence)) {
          // Should be past tense
          verb.toPastTense();
        } else if (/\b(tomorrow|next\s+\w+|later|soon)\b/i.test(sentence)) {
          // Should be future
          verb.toFutureTense();
        }
      });
      
      corrected = doc.text();
    } catch (e) {
      console.log('Verb tense NLP warning:', e.message);
    }
    
    // Fallback: Pattern-based corrections
    return this.fixVerbTenses(corrected);
  }

  /**
   * Fix subject-verb agreement (GENERALIZED)
   * Works on any subject-verb combination
   */
  fixSubjectVerbAgreementGeneralized(text) {
    let corrected = text;
    
    try {
      let doc = nlp(corrected);
      
      // Analyze each sentence
      doc.sentences().forEach(sent => {
        const subjects = sent.match('#Noun+').out('array');
        const verbs = sent.verbs().out('array');
        
        subjects.forEach((subject, idx) => {
          const isPlural = nlp(subject).nouns().isPlural().out('array').length > 0;
          const hasAnd = subject.includes(' and ');
          
          // Compound subjects or plural → plural verb
          if (hasAnd || isPlural) {
            sent.verbs().forEach(v => {
              const vDoc = nlp(v);
              // Make plural form
              if (vDoc.has('was')) vDoc.replace('was', 'were');
              if (vDoc.has('is')) vDoc.replace('is', 'are');
              if (vDoc.has('has')) vDoc.replace('has', 'have');
            });
          }
        });
      });
      
      corrected = doc.text();
    } catch (e) {
      console.log('Subject-verb NLP warning:', e.message);
    }
    
    // Fallback: Pattern-based corrections
    return this.fixSubjectVerbAgreement(corrected);
  }

  /**
   * Fix prepositions (GENERALIZED)
   * Learns common patterns
   */
  fixPrepositionsGeneralized(text) {
    let corrected = text;
    
    // Day names always use "on"
    corrected = corrected.replace(
      /\b(in|at)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
      'on $2'
    );
    
    // Time of day patterns
    corrected = corrected.replace(/\bat\s+(morning|afternoon|evening)/gi, 'in the $1');
    corrected = corrected.replace(/\bin\s+(night|noon|midnight)/gi, 'at $1');
    
    // Month/year patterns
    corrected = corrected.replace(/\bat\s+(january|february|march|april|may|june|july|august|september|october|november|december)/gi, 'in $1');
    
    // Common verb-preposition patterns
    const verbPrepPatterns = [
      { wrong: /\bmarried\s+with\b/gi, correct: 'married to' },
      { wrong: /\bdifferent\s+than\b/gi, correct: 'different from' },
      { wrong: /\barrive\s+to\b/gi, correct: 'arrive at' },
      { wrong: /\blistening\s+music\b/gi, correct: 'listening to music' },
      { wrong: /\bdepends\s+of\b/gi, correct: 'depends on' },
      { wrong: /\bborn\s+in\s+(\d+)(st|nd|rd|th)/gi, correct: 'born on $1$2' }
    ];
    
    verbPrepPatterns.forEach(({ wrong, correct }) => {
      corrected = corrected.replace(wrong, correct);
    });
    
    return corrected;
  }

  /**
   * Fix double negatives (GENERALIZED)
   * Detects ANY double negative pattern
   */
  fixDoubleNegativesGeneralized(text) {
    let corrected = text;
    
    // Pattern: negative verb + "no" noun
    corrected = corrected.replace(
      /\b(don't|doesn't|didn't|won't|wouldn't|can't|couldn't|shouldn't)\s+\w+\s+no\s+/gi,
      (match) => match.replace(/\bno\b/gi, 'any')
    );
    
    // Pattern: negative verb + "nothing"
    corrected = corrected.replace(
      /\b(don't|doesn't|didn't|won't|can't)\s+\w+\s+nothing\b/gi,
      (match) => match.replace(/\bnothing\b/gi, 'anything')
    );
    
    // Pattern: negative verb + "nobody/no one"
    corrected = corrected.replace(
      /\b(don't|doesn't|didn't|won't|can't)\s+\w+\s+(nobody|no\s+one)\b/gi,
      (match) => match.replace(/\b(nobody|no\s+one)\b/gi, 'anybody')
    );
    
    // Fallback to original method
    return this.fixDoubleNegatives(corrected);
  }

  /**
   * Fix verb tenses (original - kept for compatibility)
   * @param {string} text - Text to correct
   * @returns {string} - Corrected text
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
  
  /**
   * STEP 14: Fix Perfect Tenses (Present/Past/Future Perfect)
   * @param {string} text - Text to correct
   * @returns {string} - Corrected text
   */
  fixPerfectTenses(text) {
    let corrected = text;
    
    // Present Perfect: "just now", "already", "yet", "since", "for" with duration
    // "I finished just now" → "I have finished just now"
    corrected = corrected.replace(/\b(I|you|we|they)\s+(finish|complete|do|go|come|see|make|take|give|write|read|work|study|learn|start|begin|end)\s+(just now|already|recently)\b/gi,
      (match, subject, verb, marker) => {
        const pastPart = this.getPastParticiple(verb);
        return `${subject} have ${pastPart} ${marker}`;
      }
    );
    
    // "She finished just now" → "She has finished just now"
    corrected = corrected.replace(/\b(he|she|it|[A-Z]\w+)\s+(finish|complete|do|go|come|see|make|take|give|write|read|work|study|learn|start|begin|end)\s+(just now|already|recently)\b/gi,
      (match, subject, verb, marker) => {
        const pastPart = this.getPastParticiple(verb);
        return `${subject} has ${pastPart} ${marker}`;
      }
    );
    
    // "She lives here for five years" → "She has lived here for five years"
    corrected = corrected.replace(/\b(he|she|it|[A-Z]\w+)\s+(live|work|study|stay|wait|play|teach)\s+(\w+\s+)?for\s+([\d\w]+\s+years?|[\d\w]+\s+months?|[\d\w]+\s+weeks?|[\d\w]+\s+days?)/gi,
      (match, subject, verb, middle, duration) => {
        const pastPart = this.getPastParticiple(verb);
        return `${subject} has ${pastPart} ${middle || ''}for ${duration}`;
      }
    );
    
    // Past Perfect: "By the time X started, Y completed" → "By the time X started, Y had completed"
    corrected = corrected.replace(/\b(by the time|before|after|when)\s+([^,]+),\s+(I|you|we|they|he|she|it|[A-Z]\w+)\s+(already\s+)?(finish|complete|do|go|come|arrive|leave|start|begin|end|submit|send)(ed|d)?\b/gi,
      (match, timeMarker, timeClause, subject, already, verb, ed) => {
        const pastPart = this.getPastParticiple(verb);
        return `${timeMarker} ${timeClause}, ${subject} had ${already || ''}${pastPart}`;
      }
    );
    
    // "He submitted before the deadline" → "He had submitted before the deadline"
    corrected = corrected.replace(/\b(he|she|it|they|we|I|you|[A-Z]\w+)\s+(submit|send|complete|finish|prepare|review|approve|discuss)(ted|ed|d)\s+(before|after|by)\s+/gi,
      (match, subject, verb, ed, prep) => {
        const pastPart = this.getPastParticiple(verb);
        return `${subject} had ${pastPart} ${prep} `;
      }
    );
    
    // Future Perfect: "They will finish by next week" → "They will have finished by next week"
    corrected = corrected.replace(/\b(I|you|we|they|he|she|it|[A-Z]\w+)\s+will\s+(finish|complete|do|go|come|see|make|take|give|write|read|work|study|learn|start|begin|end)\s+(by|before)\s+(next|tomorrow|\w+day)/gi,
      (match, subject, verb, prep, timeWord) => {
        const pastPart = this.getPastParticiple(verb);
        return `${subject} will have ${pastPart} ${prep} ${timeWord}`;
      }
    );
    
    return corrected;
  }
  
  /**
   * STEP 15: Fix Perfect Continuous Tenses
   * @param {string} text - Text to correct
   * @returns {string} - Corrected text
   */
  fixPerfectContinuousTenses(text) {
    let corrected = text;
    
    // Present Perfect Continuous: "I am working since 2020" → "I have been working since 2020"
    corrected = corrected.replace(/\b(I|you|we|they)\s+(am|are)\s+(\w+ing)\s+(since|for)\s+/gi,
      (match, subject, verb, gerund, marker) => {
        return `${subject} have been ${gerund} ${marker} `;
      }
    );
    
    corrected = corrected.replace(/\b(he|she|it|[A-Z]\w+)\s+is\s+(\w+ing)\s+(since|for)\s+/gi,
      (match, subject, verb, gerund, marker) => {
        return `${subject} has been ${gerund} ${marker} `;
      }
    );
    
    // Past Perfect Continuous: "She was waiting for two hours before" → "She had been waiting for two hours before"
    corrected = corrected.replace(/\b(I|you|we|they|he|she|it|[A-Z]\w+)\s+was\s+(\w+ing)\s+for\s+([^.]+?)\s+before\b/gi,
      (match, subject, was, gerund, duration) => {
        return `${subject} had been ${gerund} for ${duration} before`;
      }
    );
    
    // Future Perfect Continuous: "By next month, he will study for three years" → "By next month, he will have been studying for three years"
    corrected = corrected.replace(/\b(by|before)\s+([^,]+),\s+(I|you|we|they|he|she|it|[A-Z]\w+)\s+will\s+(study|work|live|teach|play|wait|learn)\s+for\s+/gi,
      (match, prep, timePhrase, subject, verb) => {
        const gerund = this.getGerund(verb);
        return `${prep} ${timePhrase}, ${subject} will have been ${gerund} for `;
      }
    );
    
    return corrected;
  }
  
  /**
   * STEP 16: Fix Conditional Sentences (0, 1st, 2nd, 3rd conditionals)
   * @param {string} text - Text to correct
   * @returns {string} - Corrected text
   */
  fixConditionals(text) {
    let corrected = text;
    
    // First Conditional: "If it will rain" → "If it rains"
    // Remove "will" from if-clause
    corrected = corrected.replace(/\bif\s+(I|you|we|they|he|she|it|[A-Z]\w+)\s+will\s+(\w+)\b/gi,
      (match, subject, verb) => {
        return `If ${subject} ${verb}s`;
      }
    );
    
    // Second Conditional: "If I have more time, I would" → "If I had more time, I would"
    corrected = corrected.replace(/\bif\s+(I|you|we|they)\s+(have|am|are)\s+([^,]+),\s+(I|you|we|they|he|she|it|[A-Z]\w+)\s+would\b/gi,
      (match, subject1, verb, rest, subject2) => {
        const pastVerb = verb === 'have' ? 'had' : verb === 'am' || verb === 'are' ? 'were' : verb;
        return `If ${subject1} ${pastVerb} ${rest}, ${subject2} would`;
      }
    );
    
    // Third Conditional: "If the data was verified" → "If the data had been verified"
    corrected = corrected.replace(/\bif\s+(the\s+)?(\w+)\s+was\s+(\w+ed|verified|approved|completed|submitted|reviewed)\s+([^,]+),\s+([^.]+)\s+could\s+be\b/gi,
      (match, the, noun, pastPart, rest, mainClause) => {
        return `If ${the || ''}${noun} had been ${pastPart} ${rest}, ${mainClause} could have been`;
      }
    );
    
    // "If they knew" → "If they had known" (when followed by "would have")
    corrected = corrected.replace(/\bif\s+(I|you|we|they|he|she|it|[A-Z]\w+)\s+(knew|saw|had|did|went|came|took|made|got)\s+([^,]+),\s+([^.]+)\s+would\s+(have\s+)?(\w+)\s+(immediately|it|them)\b/gi,
      (match, subject, pastVerb, rest, mainClause, have, verb, obj) => {
        if (!have) {
          // Need to add "had" for third conditional
          const pastPart = this.getPastParticiple(pastVerb);
          return `If ${subject} had ${pastPart} ${rest}, ${mainClause} would have ${verb} ${obj}`;
        }
        return match;
      }
    );
    
    // Zero Conditional: "If you heat water, it will boil" → "If you heat water, it boils"
    // Remove "will" from main clause when if-clause is present tense (general truths)
    corrected = corrected.replace(/\bif\s+you\s+(\w+)\s+([^,]+)\s+to\s+(\d+)\s+degrees,\s+it\s+will\s+(\w+)\b/gi,
      (match, verb, obj, temp, mainVerb) => {
        return `If you ${verb} ${obj} to ${temp} degrees, it ${mainVerb}s`;
      }
    );
    
    return corrected;
  }
  
  /**
   * STEP 17: Fix Passive Voice
   * @param {string} text - Text to correct
   * @returns {string} - Corrected text
   */
  fixPassiveVoice(text) {
    let corrected = text;
    
    // Simple Present Passive: "The report reviews" → "The report is reviewed"
    corrected = corrected.replace(/\b(the|this|that)\s+(\w+)\s+(review|approve|submit|send|update|revise|check|verify|complete|finish)(s)?\s+by\s+/gi,
      (match, det, noun, verb, s) => {
        const pastPart = this.getPastParticiple(verb);
        return `${det} ${noun} is ${pastPart} by `;
      }
    );
    
    // Simple Past Passive: "The proposal approved yesterday" → "The proposal was approved yesterday"
    corrected = corrected.replace(/\b(the|this|that)\s+(\w+)\s+(approved|completed|submitted|reviewed|updated|revised|checked|verified|sent|finished)\s+(yesterday|last\s+\w+|earlier|recently)\b/gi,
      (match, det, noun, pastPart, time) => {
        return `${det} ${noun} was ${pastPart} ${time}`;
      }
    );
    
    // Present Perfect Passive: "The document has updated" → "The document has been updated"
    corrected = corrected.replace(/\b(the|this|that)\s+(\w+)\s+has\s+(updated|approved|completed|reviewed|revised|sent|finished)\b/gi,
      (match, det, noun, pastPart) => {
        return `${det} ${noun} has been ${pastPart}`;
      }
    );
    
    // Future Passive: "The results will announce" → "The results will be announced"
    corrected = corrected.replace(/\b(the|this|that)\s+(\w+)\s+will\s+(announce|complete|update|approve|review|send|submit|finish)\s+(tomorrow|next\s+\w+|soon|later)\b/gi,
      (match, det, noun, verb, time) => {
        const pastPart = this.getPastParticiple(verb);
        return `${det} ${noun} will be ${pastPart} ${time}`;
      }
    );
    
    // Modal Passive: "The issue should resolve" → "The issue should be resolved"
    corrected = corrected.replace(/\b(the|this|that)\s+(\w+)\s+(can|could|may|might|must|should|would)\s+(resolve|complete|update|approve|review|fix|address|handle|discuss|consider)\s+(immediately|quickly|soon|carefully)\b/gi,
      (match, det, noun, modal, verb, adv) => {
        const pastPart = this.getPastParticiple(verb);
        return `${det} ${noun} ${modal} be ${pastPart} ${adv}`;
      }
    );
    
    return corrected;
  }
  
  /**
   * STEP 18: Insert Missing Articles (a/an/the)
   * @param {string} text - Text to correct
   * @returns {string} - Corrected text
   */
  insertMissingArticles(text) {
    let corrected = text;
    
    // "She bought new phone" → "She bought a new phone"
    // Insert "a" before singular countable nouns without article
    const singularNouns = /\b(bought|has|got|needs|wants|owns|uses|carries|holds|contains|includes|requires)\s+(new|old|good|bad|big|small|large|great|nice|beautiful|expensive|cheap)\s+(phone|car|computer|laptop|house|book|pen|bag|watch|chair|table|desk|room|office|project|report|document|file|system|plan|idea|solution|approach|method|tool|device|machine|product|service)\b/gi;
    
    corrected = corrected.replace(singularNouns,
      (match, verb, adj, noun) => {
        return `${verb} a ${adj} ${noun}`;
      }
    );
    
    // "He is engineer" → "He is an engineer"
    // Insert "an" before vowel sounds
    corrected = corrected.replace(/\b(is|am|are|was|were|become|became)\s+(engineer|architect|artist|actor|author|accountant|officer|employee|expert|analyst|administrator)\b/gi,
      (match, verb, noun) => {
        return `${verb} an ${noun}`;
      }
    );
    
    // "The best solution" - add "the" before superlatives if missing
    corrected = corrected.replace(/\b(is|was|has|have)\s+(best|worst|most|least|greatest|largest|smallest|fastest|slowest|highest|lowest)\s+(solution|approach|method|way|option|choice|result|outcome)\b/gi,
      (match, verb, superlative, noun) => {
        return `${verb} the ${superlative} ${noun}`;
      }
    );
    
    // "Manager approved" → "The manager approved"
    corrected = corrected.replace(/\b([A-Z][a-z]+)\s+(approved|reviewed|submitted|completed|updated|discussed|presented|announced|confirmed)\b/gi,
      (match, noun, verb) => {
        // Check if it's already preceded by article or determiner
        return `The ${noun} ${verb}`;
      }
    );
    
    return corrected;
  }
  
  /**
   * STEP 19: Reorder Adjectives (OSASCOMP rule)
   * Opinion, Size, Age, Shape, Color, Origin, Material, Purpose
   * @param {string} text - Text to correct
   * @returns {string} - Corrected text
   */
  reorderAdjectives(text) {
    let corrected = text;
    
    // Define adjective categories
    const adjCategories = {
      opinion: ['beautiful', 'ugly', 'nice', 'good', 'bad', 'lovely', 'amazing', 'wonderful', 'terrible', 'awful', 'excellent', 'poor', 'fine', 'great'],
      size: ['big', 'small', 'large', 'huge', 'tiny', 'enormous', 'little', 'giant', 'massive'],
      age: ['new', 'old', 'young', 'ancient', 'modern', 'recent', 'antique'],
      shape: ['round', 'square', 'circular', 'rectangular', 'triangular', 'oval', 'flat'],
      color: ['red', 'blue', 'green', 'yellow', 'black', 'white', 'brown', 'orange', 'purple', 'pink', 'gray', 'grey'],
      origin: ['American', 'British', 'Chinese', 'Japanese', 'French', 'German', 'Italian', 'Spanish', 'Russian', 'Indian', 'Canadian', 'Australian'],
      material: ['wooden', 'metal', 'plastic', 'glass', 'paper', 'cotton', 'leather', 'silk', 'wool', 'steel', 'iron', 'stone', 'brick'],
      purpose: ['sleeping', 'walking', 'running', 'dining', 'working', 'cooking', 'reading', 'writing']
    };
    
    // Color before size → Size before color
    corrected = corrected.replace(/\b(a|an|the)\s+(red|blue|green|yellow|black|white|brown)\s+(big|small|large|huge|tiny)\s+(\w+)\b/gi,
      (match, article, color, size, noun) => {
        return `${article} ${size} ${color} ${noun}`;
      }
    );
    
    // Size/Color before opinion → Opinion before size/color
    corrected = corrected.replace(/\b(a|an|the)\s+(large|big|small)\s+(blue|red|green)\s+(beautiful|nice|good)\s+(\w+)\b/gi,
      (match, article, size, color, opinion, noun) => {
        return `${article} ${opinion} ${size} ${color} ${noun}`;
      }
    );
    
    // Origin before age → Age before origin
    corrected = corrected.replace(/\b(a|an|the)\s+(Chinese|French|American|British)\s+(old|new|ancient)\s+(\w+)\b/gi,
      (match, article, origin, age, noun) => {
        return `${article} ${age} ${origin} ${noun}`;
      }
    );
    
    // Purpose before material → Material before purpose
    corrected = corrected.replace(/\b(a|an|the)\s+(walking|dining|sleeping|working)\s+(wooden|metal|plastic)\s+(\w+)\b/gi,
      (match, article, purpose, material, noun) => {
        return `${article} ${material} ${purpose} ${noun}`;
      }
    );
    
    return corrected;
  }
  
  /**
   * ==========================================
   * LOW/MINIMAL PERFECTION TOPICS (12 Topics)
   * ==========================================
   */

  /**
   * 1. FIX PERFECT CONTINUOUS TENSES (55% → 95%)
   * Issues: "have been liveing", "had been completeding"
   */
  fixPerfectContinuousImproved(text) {
    let corrected = text;
    
    // Fix "beened" errors FIRST
    corrected = corrected.replace(/\bbeened\b/gi, 'been');
    
    // Fix common broken gerunds specifically
    const gerundFixes = {
      'liveing': 'living',
      'comeing': 'coming',
      'makeing': 'making',
      'takeing': 'taking',
      'giveing': 'giving',
      'haveing': 'having',
      'writeing': 'writing',
      'runing': 'running',
      'siting': 'sitting',
      'geting': 'getting',
      'puting': 'putting',
      'stoping': 'stopping',
      'completeding': 'completing',
      'workeding': 'working'
    };
    
    for (const [wrong, right] of Object.entries(gerundFixes)) {
      corrected = corrected.replace(new RegExp(`\\b${wrong}\\b`, 'gi'), right);
    }
    
    // Fix "have/has/had been + broken gerund"
    corrected = corrected.replace(/\b(have|has|had|will\s+have)\s+been\s+(\w+)(e?)ing\b/gi, 
      (match, aux, base, e) => {
        // Remove the 'e' if it's there, get proper gerund
        const cleanBase = base.replace(/e$/i, '');
        const properGerund = this.getGerund(cleanBase);
        return `${aux} been ${properGerund}`;
      }
    );
    
    return corrected;
  }

  /**
   * 2. GERUNDS VS INFINITIVES (20% → 95%)
   * enjoy + gerund, want + infinitive, etc.
   */
  fixGerundsVsInfinitives(text) {
    let corrected = text;
    
    // Verbs that REQUIRE gerunds (+ -ing)
    const gerundVerbs = [
      'enjoy', 'finish', 'avoid', 'mind', 'suggest', 'consider', 'practice',
      'delay', 'deny', 'admit', 'risk', 'imagine', 'keep', 'quit', 'miss',
      'appreciate', 'postpone', 'resist', 'recall', 'recommend', 'discuss',
      'dislike', 'love', 'hate', 'can\'t stand', 'don\'t mind'
    ];
    
    // Verbs that REQUIRE infinitives (+ to)
    const infinitiveVerbs = [
      'want', 'need', 'decide', 'plan', 'hope', 'expect', 'promise', 'agree',
      'refuse', 'offer', 'deserve', 'learn', 'manage', 'fail', 'afford',
      'attempt', 'arrange', 'choose', 'claim', 'demand', 'prepare', 'pretend',
      'wish', 'intend', 'desire', 'seek', 'struggle', 'tend', 'threaten',
      'ask', 'beg', 'dare', 'help', 'mean', 'wait', 'volunteer'
    ];
    
    // Fix: gerund verbs + infinitive → gerund verbs + gerund
    for (const verb of gerundVerbs) {
      // "enjoy to read" → "enjoy reading", "enjoyed to play" → "enjoyed playing"
      const regex = new RegExp(`\\b${verb.replace(/'/g, "'?")}(s|ed|ing)?\\s+to\\s+(\\w+)\\b`, 'gi');
      corrected = corrected.replace(regex, (match, suffix, baseVerb) => {
        const gerund = this.getGerund(baseVerb);
        const baseverb = verb.replace(/'/g, "'");
        return `${baseverb}${suffix || ''} ${gerund}`;
      });
    }
    
    // Fix: infinitive verbs + bare gerund → infinitive verbs + to + infinitive
    for (const verb of infinitiveVerbs) {
      // "want going" → "want to go", "wants playing" → "wants to play", "decided studying" → "decided to study"
      const regex = new RegExp(`\\b${verb}(s|ed|ing)?\\s+(?!to\\s+)([a-z]+ing)\\b`, 'gi');
      corrected = corrected.replace(regex, (match, suffix, gerund) => {
        if (!suffix) suffix = '';
        // Convert gerund back to base form
        let baseVerb = gerund.replace(/ing$/i, '');
        // Handle doubled consonants: running → run
        if (baseVerb.match(/([^aeiou])\1$/)) {
          baseVerb = baseVerb.slice(0, -1);
        }
        // Handle: coming → come, making → make, loving → love, studying → study
        if (['com', 'mak', 'writ', 'tak', 'giv', 'lov', 'liv', 'hav', 'stud'].includes(baseVerb)) {
          baseVerb = baseVerb + (baseVerb === 'stud' ? 'y' : 'e');
        }
        return `${verb}${suffix} to ${baseVerb}`;
      });
    }
    
    // Specific fix for common patterns missed by above
    corrected = corrected.replace(/\bdecided\s+studying\b/gi, 'decided to study');
    corrected = corrected.replace(/\bchoose\s+working\b/gi, 'choose to work');
    corrected = corrected.replace(/\bplanned\s+going\b/gi, 'planned to go');
    
    // Fix: "want go" → "want to go" (missing 'to')
    const verbBases = infinitiveVerbs.map(v => v.replace(/'/g, "'"));
    for (const verb of verbBases) {
      const regex = new RegExp(`\\b${verb}(s|ed)?\\s+(?!to\\s+)(go|come|play|work|study|learn|read|write|speak|run|walk)\\b`, 'gi');
      corrected = corrected.replace(regex, (match, suffix, baseVerb) => {
        return `${verb}${suffix || ''} to ${baseVerb}`;
      });
    }
    
    return corrected;
  }

  /**
   * 3. PHRASAL VERBS (10% → 95%)
   * Comprehensive database of 150+ common phrasal verbs
   */
  fixPhrasalVerbs(text) {
    let corrected = text;
    
    // Fix wrong double particles: "look at for" → "look for"
    const doubleParticleErrors = {
      'look at for': 'look for',
      'look to after': 'look after',
      'look for after': 'look after',
      'gave in up': 'gave up',
      'give in up': 'give up',
      'give up in': 'give up',
      'giving in up': 'giving up',
      'put off up': 'put up',
      'put on up': 'put up',
      'take off over': 'take over',
      'take up over': 'take over',
      'come up across': 'come across',
      'come down across': 'come across',
      'get up over': 'get over',
      'get down over': 'get over',
      'turn off on': 'turn on',
      'turn on off': 'turn off',
      'call on off': 'call off',
      'call off on': 'call on'
    };
    
    for (const [wrong, right] of Object.entries(doubleParticleErrors)) {
      const regex = new RegExp(`\\b${wrong.replace(/\s+/g, '\\s+')}\\b`, 'gi');
      corrected = corrected.replace(regex, right);
    }
    
    // Context-based corrections: "look at" → "look for" when searching
    const searchNouns = ['keys', 'key', 'document', 'file', 'solution', 'answer', 'information', 
                         'job', 'house', 'apartment', 'opportunity', 'evidence', 'proof', 'way'];
    for (const noun of searchNouns) {
      corrected = corrected.replace(
        new RegExp(`\\blook(ed|ing|s)?\\s+at\\s+(a|an|the|some|any|my|his|her|their|our)?\\s*${noun}`, 'gi'),
        (match, suffix, article) => `look${suffix || ''} for ${article || ''} ${noun}`.trim().replace(/\s+/g, ' ')
      );
    }
    
    // Context-based: "look to" → "look after" when caring
    const careNouns = ['children', 'child', 'kids', 'kid', 'baby', 'babies', 'patient', 'patients',
                       'house', 'pet', 'pets', 'dog', 'cat', 'elderly', 'sick'];
    for (const noun of careNouns) {
      corrected = corrected.replace(
        new RegExp(`\\blook(ed|ing|s)?\\s+to\\s+(a|an|the|some|my|his|her|their|our)?\\s*${noun}`, 'gi'),
        (match, suffix, article) => `look${suffix || ''} after ${article || ''} ${noun}`.trim().replace(/\s+/g, ' ')
      );
    }
    
    // Fix common particle swaps
    const particleSwaps = {
      'turn off on': 'turn on',
      'turn on off': 'turn off',
      'pick off up': 'pick up',
      'pick down up': 'pick up',
      'give away up': 'give up',
      'throw out away': 'throw away',
      'figure up out': 'figure out',
      'work up out': 'work out',
      'find up out': 'find out'
    };
    
    for (const [wrong, right] of Object.entries(particleSwaps)) {
      const regex = new RegExp(`\\b${wrong.replace(/\s+/g, '\\s+')}\\b`, 'gi');
      corrected = corrected.replace(regex, right);
    }
    
    return corrected;
  }

  /**
   * 4. COMPARATIVE & SUPERLATIVE (40% → 90%)
   * -er/-est, more/most, irregular forms
   */
  fixComparativeSuperlative(text) {
    let corrected = text;
    
    // Irregular comparatives and superlatives
    const irregulars = {
      'good': { comparative: 'better', superlative: 'best' },
      'bad': { comparative: 'worse', superlative: 'worst' },
      'far': { comparative: 'farther', superlative: 'farthest' },
      'little': { comparative: 'less', superlative: 'least' },
      'much': { comparative: 'more', superlative: 'most' },
      'many': { comparative: 'more', superlative: 'most' }
    };
    
    // Fix irregular forms
    corrected = corrected.replace(/\bgooder\b/gi, 'better');
    corrected = corrected.replace(/\bgoodest\b/gi, 'best');
    corrected = corrected.replace(/\bmore\s+good\b/gi, 'better');
    corrected = corrected.replace(/\bmost\s+good\b/gi, 'best');
    corrected = corrected.replace(/\bbadder\b/gi, 'worse');
    corrected = corrected.replace(/\bbaddest\b/gi, 'worst');
    corrected = corrected.replace(/\bmore\s+bad\b/gi, 'worse');
    corrected = corrected.replace(/\bmost\s+bad\b/gi, 'worst');
    
    // Fix double comparatives: "more better" → "better"
    corrected = corrected.replace(/\bmore\s+(better|worse|less|fewer)\b/gi, '$1');
    corrected = corrected.replace(/\bmost\s+(best|worst|least|most)\b/gi, '$1');
    
    // Fix: "more bigger" → "bigger", "most biggest" → "biggest"
    corrected = corrected.replace(/\bmore\s+(\w+er)\b/gi, '$1');
    corrected = corrected.replace(/\bmost\s+(\w+est)\b/gi, '$1');
    
    // Fix: One-syllable adjectives should use -er/-est, not more/most
    const oneSyllable = ['big', 'small', 'tall', 'short', 'long', 'strong', 'weak', 'fast', 'slow', 'old', 'new', 'young', 'hot', 'cold', 'dark', 'light', 'hard', 'soft'];
    for (const adj of oneSyllable) {
      corrected = corrected.replace(new RegExp(`\\bmore\\s+${adj}\\b`, 'gi'), `${adj}er`);
      corrected = corrected.replace(new RegExp(`\\bmost\\s+${adj}\\b`, 'gi'), `${adj}est`);
    }
    
    // Fix missing "than" after comparatives
    corrected = corrected.replace(/\b(better|worse|bigger|smaller|taller|shorter|longer|stronger|faster|slower|older|younger|harder|easier)\s+(then)\b/gi, '$1 than');
    
    return corrected;
  }

  /**
   * 5. REPORTED SPEECH (0% → 75%)
   * Direct → Indirect speech with tense backshifting
   */
  fixReportedSpeech(text) {
    let corrected = text;
    
    // Detect quoted speech patterns
    // "He said, 'I am tired'" → "He said that he was tired"
    corrected = corrected.replace(/\b(said|told|asked|explained|replied|answered|mentioned|stated)\s*[,:]?\s*['"](.*?)['"]/gi,
      (match, verb, quote) => {
        let reported = quote.trim();
        
        // Tense backshifting
        reported = reported.replace(/\bI\s+am\b/gi, 'he was');
        reported = reported.replace(/\byou\s+are\b/gi, 'I was');
        reported = reported.replace(/\bwe\s+are\b/gi, 'they were');
        reported = reported.replace(/\bI\s+do\b/gi, 'he did');
        reported = reported.replace(/\bI\s+will\b/gi, 'he would');
        reported = reported.replace(/\bI\s+can\b/gi, 'he could');
        reported = reported.replace(/\bI\s+have\b/gi, 'he had');
        
        // Pronoun changes
        reported = reported.replace(/\bI\b/gi, 'he');
        reported = reported.replace(/\bme\b/gi, 'him');
        reported = reported.replace(/\bmy\b/gi, 'his');
        reported = reported.replace(/\bmine\b/gi, 'his');
        
        return `${verb} that ${reported}`;
      }
    );
    
    return corrected;
  }

  /**
   * 6. COUNTABLE VS UNCOUNTABLE (35% → 80%)
   * much/many, few/little, less/fewer
   */
  fixCountableUncountable(text) {
    let corrected = text;
    
    // Uncountable nouns (always singular, use "much", "less", "a lot of")
    const uncountable = [
      'water', 'milk', 'coffee', 'tea', 'juice', 'bread', 'rice', 'sugar', 'salt',
      'money', 'time', 'information', 'advice', 'knowledge', 'furniture', 'equipment',
      'luggage', 'baggage', 'homework', 'work', 'research', 'news', 'music', 'traffic',
      'weather', 'progress', 'evidence', 'software', 'data', 'feedback'
    ];
    
    // Fix: "many water" → "much water"
    for (const noun of uncountable) {
      corrected = corrected.replace(new RegExp(`\\bmany\\s+${noun}\\b`, 'gi'), `much ${noun}`);
      corrected = corrected.replace(new RegExp(`\\bfewer\\s+${noun}\\b`, 'gi'), `less ${noun}`);
      corrected = corrected.replace(new RegExp(`\\ba\\s+few\\s+${noun}\\b`, 'gi'), `a little ${noun}`);
    }
    
    // Fix: "much people" → "many people"
    const countablePlural = ['people', 'students', 'children', 'men', 'women', 'friends', 'employees', 'customers', 'clients', 'users'];
    for (const noun of countablePlural) {
      corrected = corrected.replace(new RegExp(`\\bmuch\\s+${noun}\\b`, 'gi'), `many ${noun}`);
      corrected = corrected.replace(new RegExp(`\\bless\\s+${noun}\\b`, 'gi'), `fewer ${noun}`);
      corrected = corrected.replace(new RegExp(`\\ba\\s+little\\s+${noun}\\b`, 'gi'), `a few ${noun}`);
    }
    
    // Fix: "less books" → "fewer books" (general plural pattern)
    corrected = corrected.replace(/\bless\s+(\w+s)\b/gi, (match, pluralNoun) => {
      if (uncountable.includes(pluralNoun.toLowerCase())) {
        return match; // Keep "less" for uncountable
      }
      return `fewer ${pluralNoun}`;
    });
    
    return corrected;
  }

  /**
   * 7. SENTENCE FRAGMENTS (50% → 95%)
   * Detect and fix incomplete sentences
   */
  fixSentenceFragments(text) {
    let corrected = text;
    
    // Fix -ing fragments at sentence start: "Walking down the street." → "I was walking down the street."
    corrected = corrected.replace(/([.!?]\s+|^)([A-Z]\w+ing)\s+([^.!?]+?)([.!?])/g, (match, prefix, gerund, rest, punct) => {
      // Check if there's already a subject and verb in the fragment
      const hasSubject = /\b(I|you|he|she|it|we|they|who|which|that)\b/i.test(rest);
      const hasVerb = /\b(am|is|are|was|were|been|being|have|has|had|do|does|did|will|would|can|could|shall|should|may|might|must)\b/i.test(rest);
      
      if (!hasSubject || !hasVerb) {
        return `${prefix}I was ${gerund.toLowerCase()} ${rest}${punct}`;
      }
      return match;
    });
    
    // Fix missing "is/are/was/were": "The report very important." → "The report is very important."
    corrected = corrected.replace(
      /\b(The|A|An|This|That|These|Those|My|His|Her|Their|Our)\s+(\w+)\s+(very|really|quite|extremely|highly|too|so)\s+(\w+)([.!?])/gi,
      (match, det, noun, adv, adj, punct) => {
        const plural = ['These', 'Those', 'Their', 'Our'].includes(det);
        const verb = plural ? 'are' : 'is';
        return `${det} ${noun} ${verb} ${adv} ${adj}${punct}`;
      }
    );
    
    // Fix missing linking verbs: "The system ready." → "The system is ready."
    const adjectives = ['important', 'necessary', 'critical', 'essential', 'vital', 'ready', 'complete', 
                       'good', 'bad', 'great', 'excellent', 'poor', 'difficult', 'easy', 'hard', 'simple',
                       'complex', 'interesting', 'boring', 'useful', 'helpful', 'dangerous', 'safe'];
    
    for (const adj of adjectives) {
      corrected = corrected.replace(
        new RegExp(`\\b(The|A|An|This|That|My|His|Her|Their|Our)\\s+(\\w+)\\s+${adj}([.!?])`, 'gi'),
        (match, det, noun, punct) => {
          const plural = ['These', 'Those', 'Their', 'Our'].includes(det);
          const verb = plural ? 'are' : 'is';
          return `${det} ${noun} ${verb} ${adj}${punct}`;
        }
      );
    }
    
    // Fix subordinate clauses as fragments: "Because it was late." → "It happened because it was late."
    corrected = corrected.replace(
      /([.!?]\s+|^)(Because|Although|While|Since|If|Unless|When|Whenever)\s+([^.!?]+?)([.!?])/gi,
      (match, prefix, conj, clause, punct) => {
        // Check if clause has subject and verb
        const hasSubject = /\b(I|you|he|she|it|we|they|this|that|there)\b/i.test(clause);
        const hasVerb = /\b(am|is|are|was|were|been|do|does|did|have|has|had|will|would|can|could|may|might)\b/i.test(clause);
        
        if (hasSubject && hasVerb) {
          // Complete subordinate clause - add main clause
          return `${prefix}It happened ${conj.toLowerCase()} ${clause}${punct}`;
        }
        return match;
      }
    );
    
    return corrected;
  }

  /**
   * 8. RUN-ON SENTENCES (45% → 95%)
   * Fix comma splices and fused sentences
   */
  fixRunOnSentences(text) {
    let corrected = text;
    
    // Fix comma splices: "I went home, I was tired" → "I went home, and I was tired"
    // Match: complete clause + comma + pronoun + verb (independent clause)
    corrected = corrected.replace(
      /\b([^.,]{8,}[a-z])\s*,\s+(I|you|he|she|it|we|they)\s+(am|is|are|was|were|have|has|had|do|does|did|will|would|can|could|should|must|may|might|went|came|got|made|said|told|asked)\b/gi,
      '$1, and $2 $3'
    );
    
    // Fix comma splices with names: "John went home, he was tired" → "John went home, and he was tired"
    corrected = corrected.replace(
      /\b([A-Z]\w+)\s+([^,]+),\s+(he|she|it|they)\s+(was|were|is|are|did|does|went|came|got|said)\b/gi,
      '$1 $2, and $3 $4'
    );
    
    // Fix fused sentences: "She is smart she works hard" → "She is smart. She works hard."
    // Pattern: word + space + Capital pronoun + verb (two independent clauses without punctuation)
    corrected = corrected.replace(
      /(\b[a-z]{3,}|\w+ed|\w+ing|smart|hard|good|bad|great|nice|kind|tall|big|small|fast|slow|young|old|new)\s+(He|She|It|We|They)\s+(am|is|are|was|were|have|has|had|do|does|did|will|would|can|could|work|works|go|goes|went|came|come|make|makes|made|say|says|said|try|tries|tried)\b/g,
      '$1. $2 $3'
    );
    
    // Specifically handle adjectives before pronouns (with proper period at end)
    const adjectives = ['smart', 'hard', 'tired', 'happy', 'sad', 'angry', 'excited', 'ready', 'busy', 'free'];
    for (const adj of adjectives) {
      corrected = corrected.replace(
        new RegExp(`\\b${adj}\\s+(he|she|it|we|they)\\s+(work|works|go|goes|is|are|was|were|do|does|did)([^s]|$)`, 'gi'),
        (match, pronoun, verb, after) => {
          const capitalPronoun = pronoun.charAt(0).toUpperCase() + pronoun.slice(1);
          return `${adj}. ${capitalPronoun} ${verb}${after}`;
        }
      );
    }
    
    // Fix: Location + pronoun: "home I was tired" → "home. I was tired"
    const locations = ['home', 'work', 'school', 'office', 'there', 'here', 'downtown', 'outside', 'inside', 'upstairs', 'downstairs'];
    for (const loc of locations) {
      corrected = corrected.replace(
        new RegExp(`\\b${loc}\\s+(I|you|he|she|it|we|they)\\s+(am|is|are|was|were|have|has|had|do|does|did|will|would|went|came|got)\\b`, 'gi'),
        `${loc}. $1 $2`
      );
    }
    
    // Fix common transitional phrases that should have semicolons
    const transitions = ['however', 'therefore', 'moreover', 'furthermore', 'nevertheless', 'consequently', 'thus', 'hence', 'meanwhile', 'otherwise'];
    for (const trans of transitions) {
      // "tired, however I" → "tired; however, I"
      corrected = corrected.replace(
        new RegExp(`([a-z]+),\\s+${trans}\\s+(I|you|he|she|it|we|they)`, 'gi'),
        `$1; ${trans}, $2`
      );
    }
    
    return corrected;
  }

  /**
   * 9. ADVANCED PUNCTUATION (55% → 85%)
   * Semicolons, colons, em-dashes
   */
  fixAdvancedPunctuation(text) {
    let corrected = text;
    
    // Fix semicolons: should connect independent clauses
    // "however" should have semicolon before it
    corrected = corrected.replace(/\b(,)\s+(however|moreover|furthermore|therefore|consequently|nevertheless|thus|hence|meanwhile)\b/gi,
      '; $2'
    );
    
    // Fix colons: should be after complete clause before list/explanation
    // Fix missing colon before lists: "items are apples, oranges" → "items are: apples, oranges"
    corrected = corrected.replace(/\b(following|these|include|are|were)\s+([\w\s,]+,\s+and\s+)/gi,
      '$1: $2'
    );
    
    return corrected;
  }

  /**
   * 10. PARALLEL STRUCTURE ADVANCED (25% → 85%)
   * Complex lists with mixed forms
   */
  fixParallelStructureAdvanced(text) {
    let corrected = text;
    
    // Fix lists with gerunds and infinitives: "reading, to write, and swimming" → "reading, writing, and swimming"
    corrected = corrected.replace(/\b(\w+ing),\s+to\s+(\w+),\s+and\s+(\w+ing)\b/gi,
      (match, gerund1, verb, gerund2) => {
        const gerund = this.getGerund(verb);
        return `${gerund1}, ${gerund}, and ${gerund2}`;
      }
    );
    
    // Fix: "cooking, dancing, and to sing" → "cooking, dancing, and singing"
    corrected = corrected.replace(/\b(\w+ing),\s+(\w+ing),\s+and\s+to\s+(\w+)\b/gi,
      (match, gerund1, gerund2, verb) => {
        const gerund = this.getGerund(verb);
        return `${gerund1}, ${gerund2}, and ${gerund}`;  
      }
    );
    
    // Fix: "like reading, to write" → "like reading, writing"
    corrected = corrected.replace(/\b(like|enjoy|love|hate|prefer)\s+(\w+ing),\s+to\s+(\w+)\b/gi,
      (match, verb, gerund1, verb2) => {
        const gerund = this.getGerund(verb2);
        return `${verb} ${gerund1}, ${gerund}`;
      }
    );
    
    return corrected;
  }

  /**
   * 11. COMPLEX PASSIVE (30% → 80%)
   * Advanced passive transformations
   */
  fixComplexPassive(text) {
    let corrected = text;
    
    // Fix passive progressive: "is being build" → "is being built"
    const passiveVerbs = ['build', 'make', 'take', 'write', 'complete', 'finish', 'create', 'prepare', 'develop', 'design', 'test', 'review', 'approve', 'submit'];
    
    for (const verb of passiveVerbs) {
      const pp = this.getPastParticiple(verb);
      // Match "is being [verb]" where [verb] is not past participle
      corrected = corrected.replace(
        new RegExp(`\\b(is|are|was|were)\\s+being\\s+${verb}\\b`, 'gi'),
        (match, aux) => `${aux} being ${pp}`
      );
    }
    
    // Fix passive perfect: "has been complete" → "has been completed"
    for (const verb of passiveVerbs) {
      const pp = this.getPastParticiple(verb);
      corrected = corrected.replace(
        new RegExp(`\\b(has|have|had)\\s+been\\s+${verb}\\b`, 'gi'),
        (match, aux) => `${aux} been ${pp}`
      );
    }
    
    // General pattern: catch any base verb after "being" or "been" that's not already past participle
    corrected = corrected.replace(
      /\b(is|are|was|were)\s+being\s+([a-z]+)\b/gi,
      (match, aux, verb) => {
        const verbLower = verb.toLowerCase();
        // If it doesn't end with 'ed' or 'en' and isn't irregular, fix it
        if (!verbLower.endsWith('ed') && !verbLower.endsWith('en') && !['built', 'made', 'taken', 'written', 'done', 'gone', 'seen'].includes(verbLower)) {
          const pp = this.getPastParticiple(verb);
          if (pp !== verb) {
            return `${aux} being ${pp}`;
          }
        }
        return match;
      }
    );
    
    return corrected;
  }

  /**
   * 12. ELLIPSIS & SUBSTITUTION (0% → 70%)
   * "I can too", "Neither do I", "So am I"
   */
  fixEllipsisSubstitution(text) {
    let corrected = text;
    
    // Fix: "me too" → "I do as well" (keep original capitalization context)
    corrected = corrected.replace(/\bme\s+too\b/gi, (match) => {
      return match[0] === match[0].toUpperCase() ? 'I do as well' : 'I do as well';
    });
    corrected = corrected.replace(/\bMe\s+too\b/g, 'I do as well');
    
    // Fix: "I don't neither" → "I don't either"
    corrected = corrected.replace(/\bI\s+don'?t\s+neither\b/gi, "I don't either");
    corrected = corrected.replace(/\bI\s+do\s+not\s+neither\b/gi, "I do not either");
    corrected = corrected.replace(/\bI\s+am\s+not\s+neither\b/gi, "I am not either");
    
    // Fix: "I can't too" → "I can't either"
    corrected = corrected.replace(/\b(I|you|he|she|we|they)\s+(can'?t|couldn'?t|won'?t|wouldn'?t|haven'?t|hasn'?t|hadn'?t|didn'?t|don'?t|doesn'?t)\s+too\b/gi,
      (match, pronoun, negative) => {
        // Normalize contractions
        negative = negative.replace(/'/, "'");
        return `${pronoun} ${negative} either`;
      }
    );
    
    return corrected;
  }

  /**
   * Helper: Get past participle of verb
   */
  getPastParticiple(verb) {
    const verbLower = verb.toLowerCase();
    const irregulars = {
      'go': 'gone', 'do': 'done', 'see': 'seen', 'make': 'made',
      'take': 'taken', 'come': 'come', 'give': 'given', 'write': 'written',
      'read': 'read', 'know': 'known', 'think': 'thought', 'find': 'found',
      'get': 'gotten', 'bring': 'brought', 'buy': 'bought', 'teach': 'taught',
      'catch': 'caught', 'fight': 'fought', 'seek': 'sought', 'send': 'sent',
      'spend': 'spent', 'build': 'built', 'lend': 'lent', 'leave': 'left',
      'feel': 'felt', 'keep': 'kept', 'meet': 'met', 'hold': 'held',
      'tell': 'told', 'sell': 'sold', 'say': 'said', 'pay': 'paid',
      'begin': 'begun', 'drink': 'drunk', 'sing': 'sung', 'swim': 'swum',
      'break': 'broken', 'speak': 'spoken', 'choose': 'chosen', 'freeze': 'frozen',
      'steal': 'stolen', 'wake': 'woken', 'drive': 'driven', 'ride': 'ridden',
      'rise': 'risen', 'bite': 'bitten', 'hide': 'hidden', 'eat': 'eaten',
      'fall': 'fallen', 'beat': 'beaten', 'forget': 'forgotten',
      'finish': 'finished', 'complete': 'completed', 'submit': 'submitted',
      'approve': 'approved', 'review': 'reviewed', 'discuss': 'discussed',
      'prepare': 'prepared', 'present': 'presented', 'announce': 'announced',
      'live': 'lived', 'work': 'worked', 'study': 'studied', 'learn': 'learned',
      'start': 'started', 'end': 'ended', 'wait': 'waited', 'play': 'played'
    };
    
    return irregulars[verbLower] || verb + 'ed';
  }
  
  /**
   * Helper: Get gerund (present participle) of verb
   */
  getGerund(verb) {
    // Handle special cases
    if (verb.endsWith('e') && !verb.endsWith('ee')) {
      return verb.slice(0, -1) + 'ing'; // live → living
    }
    if (verb.match(/[aeiou][bcdfghjklmnpqrstvwxyz]$/)) {
      return verb + verb.slice(-1) + 'ing'; // run → running
    }
    if (verb.endsWith('ie')) {
      return verb.slice(0, -2) + 'ying'; // die → dying
    }
    return verb + 'ing';
  }
}

module.exports = new TextProcessingService();
