import API_URL from '../config';

/**
 * Grammar Testing Utility for Console Debugging
 * 
 * Usage in browser console:
 * 
 * 1. Test single sentence:
 *    window.testGrammar("i want to go for shopping and eating chocolate")
 * 
 * 2. Test multiple sentences:
 *    window.testGrammar([
 *      "i want to go for shopping",
 *      "he go to school everyday",
 *      "she are working hard"
 *    ])
 * 
 * 3. Detailed test with comparison:
 *    window.testGrammarDetailed("Because the deadline was approaching, they worked late")
 */

class GrammarTester {
  constructor() {
    this.apiUrl = API_URL;
  }

  async checkGrammar(text) {
    try {
      const response = await fetch(`${this.apiUrl}/mom/process-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data?.processedText || data.processedText || data.correctedText || text;
    } catch (error) {
      console.error('❌ Grammar check failed:', error.message);
      return null;
    }
  }

  async testSingle(text) {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 GRAMMAR TEST');
    console.log('='.repeat(80));
    console.log(`\n📝 INPUT:  ${text}`);
    
    const startTime = performance.now();
    const result = await this.checkGrammar(text);
    const duration = performance.now() - startTime;
    
    if (result) {
      console.log(`\n✅ OUTPUT: ${result}`);
      console.log(`\n⏱️  Processing time: ${duration.toFixed(0)}ms`);
      
      if (result.toLowerCase() === text.toLowerCase()) {
        console.log('\n💡 No changes made (text was already correct or no improvements found)');
      } else {
        console.log('\n✨ Changes detected:');
        this.highlightDifferences(text, result);
      }
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    return result;
  }

  async testMultiple(texts) {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 BATCH GRAMMAR TEST');
    console.log(`Testing ${texts.length} sentences`);
    console.log('='.repeat(80));
    
    const results = [];
    
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      console.log(`\n[${i + 1}/${texts.length}] 📝 INPUT:  ${text}`);
      
      const result = await this.checkGrammar(text);
      
      if (result) {
        console.log(`         ✅ OUTPUT: ${result}`);
        results.push({ input: text, output: result, changed: result !== text });
      } else {
        console.log(`         ❌ FAILED`);
        results.push({ input: text, output: null, changed: false, error: true });
      }
    }
    
    // Summary
    console.log('\n' + '-'.repeat(80));
    console.log('📊 SUMMARY:');
    const changed = results.filter(r => r.changed).length;
    const errors = results.filter(r => r.error).length;
    const unchanged = results.length - changed - errors;
    
    console.log(`   ✨ Changed:   ${changed}/${results.length}`);
    console.log(`   ✓  Unchanged: ${unchanged}/${results.length}`);
    if (errors > 0) {
      console.log(`   ❌ Errors:    ${errors}/${results.length}`);
    }
    console.log('='.repeat(80) + '\n');
    
    return results;
  }

  async testDetailed(text, expectedOutput = null) {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 DETAILED GRAMMAR TEST');
    console.log('='.repeat(80));
    
    console.log(`\n📝 INPUT:`);
    console.log(`   "${text}"`);
    
    if (expectedOutput) {
      console.log(`\n🎯 EXPECTED:`);
      console.log(`   "${expectedOutput}"`);
    }
    
    const startTime = performance.now();
    const result = await this.checkGrammar(text);
    const duration = performance.now() - startTime;
    
    if (result) {
      console.log(`\n✅ ACTUAL OUTPUT:`);
      console.log(`   "${result}"`);
      console.log(`\n⏱️  Processing time: ${duration.toFixed(0)}ms`);
      
      // Analyze differences
      if (expectedOutput) {
        if (result.toLowerCase() === expectedOutput.toLowerCase()) {
          console.log('\n✅ PERFECT MATCH! Output matches expected result.');
        } else {
          console.log('\n⚠️  OUTPUT DIFFERS FROM EXPECTED:');
          this.compareTexts(expectedOutput, result);
        }
      } else {
        if (result.toLowerCase() === text.toLowerCase()) {
          console.log('\n💡 No changes made');
        } else {
          console.log('\n✨ Changes made:');
          this.highlightDifferences(text, result);
        }
      }
      
      // Word-by-word analysis
      console.log('\n📊 ANALYSIS:');
      const inputWords = text.split(/\s+/);
      const outputWords = result.split(/\s+/);
      console.log(`   Input words:  ${inputWords.length}`);
      console.log(`   Output words: ${outputWords.length}`);
      console.log(`   Characters:   ${text.length} → ${result.length} (${result.length > text.length ? '+' : ''}${result.length - text.length})`);
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
    return result;
  }

  highlightDifferences(original, corrected) {
    const origWords = original.toLowerCase().split(/\s+/);
    const corrWords = corrected.toLowerCase().split(/\s+/);
    
    const maxLen = Math.max(origWords.length, corrWords.length);
    const differences = [];
    
    for (let i = 0; i < maxLen; i++) {
      if (origWords[i] !== corrWords[i]) {
        differences.push({
          position: i + 1,
          from: origWords[i] || '(none)',
          to: corrWords[i] || '(none)'
        });
      }
    }
    
    if (differences.length === 0) {
      console.log('   (Only capitalization or punctuation changes)');
    } else {
      differences.forEach(diff => {
        console.log(`   Word ${diff.position}: "${diff.from}" → "${diff.to}"`);
      });
    }
  }

  compareTexts(expected, actual) {
    const expWords = expected.toLowerCase().split(/\s+/);
    const actWords = actual.toLowerCase().split(/\s+/);
    
    const maxLen = Math.max(expWords.length, actWords.length);
    
    for (let i = 0; i < maxLen; i++) {
      if (expWords[i] !== actWords[i]) {
        console.log(`   Word ${i + 1}:`);
        console.log(`      Expected: "${expWords[i] || '(none)'}"`);
        console.log(`      Actual:   "${actWords[i] || '(none)'}"`);
      }
    }
  }

  // Test suite with common errors
  async runTestSuite() {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 COMPREHENSIVE GRAMMAR TEST SUITE');
    console.log('='.repeat(80));
    
    const testCases = [
      { name: 'Idiomatic Verbs', text: 'i want to go for shopping and eating chocolate', expected: 'I want to go shopping and eat chocolate' },
      { name: 'Parallel Structure', text: 'he likes reading and to write', expected: 'He likes reading and writing' },
      { name: 'Subject-Verb Agreement', text: 'she go to school everyday', expected: 'She goes to school every day' },
      { name: 'Past Tense Narrative', text: 'because the deadline was approaching they worked late', expected: 'Because the deadline was approaching, they worked late' },
      { name: 'Articles', text: 'he bought new car yesterday', expected: 'He bought a new car yesterday' },
      { name: 'Modal + Base Verb', text: 'i can helped you tomorrow', expected: 'I can help you tomorrow' },
      { name: 'Prepositions', text: 'she is good in mathematics', expected: 'She is good at mathematics' },
      { name: 'For vs To', text: 'i need this for complete the project', expected: 'I need this to complete the project' }
    ];
    
    const results = [];
    
    for (let i = 0; i < testCases.length; i++) {
      const test = testCases[i];
      console.log(`\n[${i + 1}/${testCases.length}] ${test.name}`);
      console.log(`    Input:    "${test.text}"`);
      console.log(`    Expected: "${test.expected}"`);
      
      const result = await this.checkGrammar(test.text);
      
      if (result) {
        console.log(`    Got:      "${result}"`);
        const passed = result.toLowerCase() === test.expected.toLowerCase();
        console.log(passed ? '    ✅ PASS' : '    ❌ FAIL');
        results.push({ ...test, result, passed });
      } else {
        console.log('    ❌ ERROR');
        results.push({ ...test, result: null, passed: false, error: true });
      }
    }
    
    // Summary
    console.log('\n' + '-'.repeat(80));
    console.log('📊 TEST SUITE RESULTS:');
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed && !r.error).length;
    const errors = results.filter(r => r.error).length;
    
    console.log(`   ✅ Passed: ${passed}/${results.length} (${(passed / results.length * 100).toFixed(1)}%)`);
    console.log(`   ❌ Failed: ${failed}/${results.length}`);
    if (errors > 0) {
      console.log(`   ⚠️  Errors: ${errors}/${results.length}`);
    }
    console.log('='.repeat(80) + '\n');
    
    return results;
  }
}

// Create global instance
const grammarTester = new GrammarTester();

// Export global test functions
export const setupGrammarTester = () => {
  // Make test functions available globally
  window.testGrammar = (text) => {
    if (Array.isArray(text)) {
      return grammarTester.testMultiple(text);
    } else {
      return grammarTester.testSingle(text);
    }
  };

  window.testGrammarDetailed = (text, expected) => {
    return grammarTester.testDetailed(text, expected);
  };

  window.runGrammarTests = () => {
    return grammarTester.runTestSuite();
  };

  window.checkGrammar = (text) => {
    return grammarTester.checkGrammar(text);
  };

  console.log('✅ Grammar Testing Tools Loaded!');
  console.log('\n📚 Available Commands:');
  console.log('   window.testGrammar("your text here")');
  console.log('   window.testGrammar(["text 1", "text 2", ...])');
  console.log('   window.testGrammarDetailed("text", "expected output")');
  console.log('   window.runGrammarTests()  // Run full test suite');
  console.log('   window.checkGrammar("text")  // Just get corrected text\n');
};

export default grammarTester;
