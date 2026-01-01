import React, { useState } from 'react';
import { Check, RefreshCw, AlertCircle, BookOpen, Zap, Copy, Download } from 'lucide-react';

const GrammarCheckerTool = () => {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState('check'); // 'check' or 'reframe'
  const [reframeStyle, setReframeStyle] = useState('formal');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // Comprehensive grammar rules database
  const grammarRules = {
    // Subject-verb agreement
    svAgreement: {
      patterns: [
        { regex: /(he|she|it|this|that|everyone|everybody|someone|somebody|no one|nobody|each|either|neither)\s+(are|have|were|do)/gi, 
          fix: (match) => match.replace(/(are|have|were|do)/i, m => ({are:'is', have:'has', were:'was', do:'does'}[m.toLowerCase()])),
          message: 'Subject-verb disagreement detected' },
        { regex: /(I|you|we|they|these|those)\s+(is|has|was|does)/gi,
          fix: (match) => match.replace(/(is|has|was|does)/i, m => ({is:'are', has:'have', was:'were', does:'do'}[m.toLowerCase()])),
          message: 'Subject-verb disagreement detected' }
      ]
    },
    
    // Articles (a/an/the)
    articles: {
      patterns: [
        { regex: /\ba\s+([aeiouAEIOU])/g, 
          fix: (match) => match.replace(/\ba\s+/, 'an '),
          message: 'Use "an" before vowel sounds' },
        { regex: /\ban\s+([^aeiouAEIOU])/g,
          fix: (match) => match.replace(/\ban\s+/, 'a '),
          message: 'Use "a" before consonant sounds' }
      ]
    },
    
    // Common homophones
    homophones: {
      patterns: [
        { regex: /\b(your)\s+(going|coming|the|a)\b/gi,
          fix: (match) => match.replace(/your/i, "you're"),
          message: 'Did you mean "you\'re" (you are)?' },
        { regex: /\b(youre|you re)\s+(book|car|house|friend|family)/gi,
          fix: (match) => match.replace(/(youre|you re)/i, 'your'),
          message: 'Did you mean "your" (possessive)?' },
        { regex: /\b(its)\s+(going|coming|been|a|the)\b/gi,
          fix: (match) => match.replace(/its/i, "it's"),
          message: 'Did you mean "it\'s" (it is/has)?' },
        { regex: /\b(it's)\s+(tail|color|owner|purpose)\b/gi,
          fix: (match) => match.replace(/it's/i, 'its'),
          message: 'Did you mean "its" (possessive)?' },
        { regex: /\b(their)\s+(going|coming|here|ready)\b/gi,
          fix: (match) => match.replace(/their/i, "they're"),
          message: 'Did you mean "they\'re" (they are)?' },
        { regex: /\b(there)\s+(house|car|idea)\b/gi,
          fix: (match) => match.replace(/there/i, 'their'),
          message: 'Did you mean "their" (possessive)?' }
      ]
    },
    
    // Punctuation
    punctuation: {
      patterns: [
        { regex: /([a-z])\s*\?\s*([A-Z])/g,
          fix: (match, p1, p2) => `${p1}? ${p2}`,
          message: 'Add space after question mark' },
        { regex: /([a-z])\s*\.\s*([A-Z])/g,
          fix: (match, p1, p2) => `${p1}. ${p2}`,
          message: 'Ensure proper spacing after period' },
        { regex: /\s+,/g,
          fix: (match) => ',',
          message: 'No space before comma' },
        { regex: /,([A-Za-z])/g,
          fix: (match, p1) => `, ${p1}`,
          message: 'Add space after comma' },
        { regex: /\s{2,}/g,
          fix: () => ' ',
          message: 'Remove extra spaces' }
      ]
    },
    
    // Double negatives
    doubleNegatives: {
      patterns: [
        { regex: /don't\s+(need|want|have)\s+no\b/gi,
          fix: (match) => match.replace(/no\b/i, 'any'),
          message: 'Avoid double negatives' },
        { regex: /\bain't\s+got\s+no\b/gi,
          fix: (match) => "don't have any",
          message: 'Avoid double negatives and informal contractions' }
      ]
    },
    
    // Capitalization
    capitalization: {
      patterns: [
        { regex: /(^|[.!?]\s+)([a-z])/g,
          fix: (match, p1, p2) => p1 + p2.toUpperCase(),
          message: 'Capitalize first letter of sentence' },
        { regex: /\bi\s/g,
          fix: () => 'I ',
          message: 'Capitalize pronoun "I"' }
      ]
    },
    
    // Common verb errors
    verbErrors: {
      patterns: [
        { regex: /\bgoed\b/gi, fix: () => 'went', message: 'Irregular verb: go → went' },
        { regex: /\bseen\b(?!\s+(by|as))/gi, fix: () => 'saw', message: 'Use "saw" for past tense without auxiliary' },
        { regex: /\bdone\b(?!\s+(by|it|this))/gi, fix: () => 'did', message: 'Use "did" for past tense without auxiliary' },
        { regex: /\bcomed\b/gi, fix: () => 'came', message: 'Irregular verb: come → came' },
        { regex: /\bshould\s+of\b/gi, fix: () => 'should have', message: 'Use "should have" not "should of"' },
        { regex: /\bcould\s+of\b/gi, fix: () => 'could have', message: 'Use "could have" not "could of"' },
        { regex: /\bwould\s+of\b/gi, fix: () => 'would have', message: 'Use "would have" not "would of"' }
      ]
    }
  };

  const checkGrammar = (text) => {
    const errors = [];
    let correctedText = text;

    // Check each rule category
    Object.entries(grammarRules).forEach(([category, ruleSet]) => {
      ruleSet.patterns.forEach((rule) => {
        const matches = [...text.matchAll(rule.regex)];
        matches.forEach((match) => {
          const errorStart = match.index;
          const errorEnd = errorStart + match[0].length;
          
          errors.push({
            category,
            original: match[0],
            suggestion: rule.fix(match[0]),
            message: rule.message,
            position: { start: errorStart, end: errorEnd }
          });
        });
      });
    });

    // Apply all corrections
    errors.forEach((error) => {
      correctedText = correctedText.replace(error.original, error.suggestion);
    });

    return { errors, correctedText };
  };

  const reframeText = async (text, style) => {
    setLoading(true);
    
    try {
      const stylePrompts = {
        formal: `Rewrite this text in a formal, professional tone suitable for business or academic contexts. Maintain the original meaning but use sophisticated vocabulary and proper grammar:

"${text}"

Provide only the rewritten text without explanations.`,
        
        casual: `Rewrite this text in a casual, friendly tone suitable for everyday conversation. Keep it natural and approachable while maintaining clarity:

"${text}"

Provide only the rewritten text without explanations.`,
        
        concise: `Make this text more concise while preserving all key information and maintaining perfect grammar:

"${text}"

Provide only the rewritten text without explanations.`,
        
        academic: `Rewrite this text in an academic tone suitable for research papers or scholarly articles. Use precise language, formal structure, and objective phrasing:

"${text}"

Provide only the rewritten text without explanations.`,
        
        persuasive: `Rewrite this text to be more persuasive and compelling. Use rhetorical techniques, stronger language, and convincing arguments while maintaining factual accuracy:

"${text}"

Provide only the rewritten text without explanations.`,
        
        simple: `Simplify this text to make it easier to understand. Use shorter sentences, common words, and clear explanations while keeping the main message:

"${text}"

Provide only the rewritten text without explanations.`
      };

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: stylePrompts[style]
            }
          ]
        })
      });

      const data = await response.json();
      const reframedText = data.content[0].text.trim();
      
      setLoading(false);
      return reframedText;
      
    } catch (error) {
      setLoading(false);
      console.error('Reframing error:', error);
      return 'Error: Unable to reframe text. Please try again.';
    }
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      alert('Please enter some text to analyze');
      return;
    }

    if (mode === 'check') {
      const { errors, correctedText } = checkGrammar(inputText);
      setResults({
        type: 'grammar',
        original: inputText,
        corrected: correctedText,
        errors: errors,
        errorCount: errors.length
      });
    } else {
      const reframed = await reframeText(inputText, reframeStyle);
      setResults({
        type: 'reframe',
        original: inputText,
        reframed: reframed,
        style: reframeStyle
      });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const downloadAsText = (text) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mode === 'check' ? 'corrected' : 'reframed'}_text.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <BookOpen className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-800">Advanced Grammar Tool</h1>
          </div>
          <p className="text-gray-600">Professional grammar checking and intelligent text reframing</p>
        </div>

        {/* Mode Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setMode('check')}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                mode === 'check'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Check className="w-5 h-5" />
              Grammar Check
            </button>
            <button
              onClick={() => setMode('reframe')}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                mode === 'reframe'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <RefreshCw className="w-5 h-5" />
              Reframe Text
            </button>
          </div>

          {mode === 'reframe' && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Reframing Style:
              </label>
              <select
                value={reframeStyle}
                onChange={(e) => setReframeStyle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="formal">Formal / Professional</option>
                <option value="casual">Casual / Friendly</option>
                <option value="concise">Concise / Brief</option>
                <option value="academic">Academic / Scholarly</option>
                <option value="persuasive">Persuasive / Compelling</option>
                <option value="simple">Simple / Easy to Understand</option>
              </select>
            </div>
          )}

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              mode === 'check'
                ? 'Enter your text here to check for grammar errors...\n\nExample: "She dont like going to they\'re house because its always messy."'
                : 'Enter your text here to reframe it...\n\nExample: "I think we should maybe consider doing this project differently."'
            }
            className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className={`w-full mt-4 py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : mode === 'check'
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md'
            }`}
          >
            <Zap className="w-5 h-5" />
            {loading ? 'Processing...' : mode === 'check' ? 'Check Grammar' : 'Reframe Text'}
          </button>
        </div>

        {/* Results Section */}
        {results && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            {results.type === 'grammar' ? (
              <>
                {/* Grammar Check Results */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Grammar Analysis</h2>
                    <span className={`px-4 py-2 rounded-full font-semibold ${
                      results.errorCount === 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {results.errorCount === 0 ? 'Perfect!' : `${results.errorCount} issue${results.errorCount > 1 ? 's' : ''} found`}
                    </span>
                  </div>

                  {results.errorCount > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        Issues Detected:
                      </h3>
                      <div className="space-y-3">
                        {results.errors.map((error, index) => (
                          <div key={index} className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-red-700">{error.message}</p>
                                <div className="mt-2 text-sm">
                                  <span className="text-red-600">Original: </span>
                                  <span className="bg-red-100 px-2 py-1 rounded line-through">{error.original}</span>
                                  <span className="mx-2">→</span>
                                  <span className="text-green-600">Suggestion: </span>
                                  <span className="bg-green-100 px-2 py-1 rounded">{error.suggestion}</span>
                                </div>
                              </div>
                              <span className="text-xs bg-gray-200 px-2 py-1 rounded ml-2">
                                {error.category}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Original Text:</h3>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-32">
                        <p className="whitespace-pre-wrap">{results.original}</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-700">Corrected Text:</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(results.corrected)}
                            className="text-blue-600 hover:text-blue-700 p-1"
                            title="Copy to clipboard"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => downloadAsText(results.corrected)}
                            className="text-blue-600 hover:text-blue-700 p-1"
                            title="Download as text file"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200 min-h-32">
                        <p className="whitespace-pre-wrap">{results.corrected}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Reframe Results */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Reframed Text</h2>
                    <span className="px-4 py-2 rounded-full font-semibold bg-purple-100 text-purple-700">
                      Style: {results.style.charAt(0).toUpperCase() + results.style.slice(1)}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Original Text:</h3>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-32">
                        <p className="whitespace-pre-wrap">{results.original}</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-700">Reframed Text:</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(results.reframed)}
                            className="text-purple-600 hover:text-purple-700 p-1"
                            title="Copy to clipboard"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => downloadAsText(results.reframed)}
                            className="text-purple-600 hover:text-purple-700 p-1"
                            title="Download as text file"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 min-h-32">
                        <p className="whitespace-pre-wrap">{results.reframed}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Features:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Detects subject-verb agreement errors</li>
            <li>• Fixes common homophones (your/you're, its/it's, their/there/they're)</li>
            <li>• Corrects article usage (a/an)</li>
            <li>• Identifies punctuation issues</li>
            <li>• Catches double negatives and informal language</li>
            <li>• AI-powered text reframing in 6 different styles</li>
            <li>• Copy and download your corrected/reframed text</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GrammarCheckerTool;