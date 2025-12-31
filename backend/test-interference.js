/**
 * Test to demonstrate function interference when run in sequence
 */

const textProcessingService = require('./services/textProcessingService');

console.log('========== TESTING FUNCTION INTERFERENCE ==========\n');

const testCases = [
  {
    input: 'He said, "I am tired"',
    topic: 'Reported Speech',
    expectedFunction: 'fixReportedSpeech'
  },
  {
    input: 'The house is being build',
    topic: 'Complex Passive',
    expectedFunction: 'fixComplexPassive'
  },
  {
    input: 'I went home, I was tired',
    topic: 'Run-on Sentence',
    expectedFunction: 'fixRunOnSentences'
  },
  {
    input: 'Walking down the street.',
    topic: 'Sentence Fragment',
    expectedFunction: 'fixSentenceFragments'
  }
];

testCases.forEach((test, i) => {
  console.log(`\n${i + 1}. ${test.topic}`);
  console.log(`   Input: "${test.input}"`);
  
  // Test 1: Call function in isolation
  const isolatedResult = textProcessingService[test.expectedFunction](test.input);
  console.log(`   Isolated: "${isolatedResult}"`);
  
  // Test 2: Call through full pipeline
  const pipelineResult = textProcessingService.applyAdvancedGrammarRules(test.input);
  console.log(`   Pipeline: "${pipelineResult}"`);
  
  // Compare
  const changed = isolatedResult !== test.input;
  const sameAsPipeline = isolatedResult === pipelineResult;
  
  if (changed && !sameAsPipeline) {
    console.log(`   ⚠️ INTERFERENCE DETECTED! Function works alone but fails in pipeline`);
  } else if (changed && sameAsPipeline) {
    console.log(`   ✅ Works correctly in both isolation and pipeline`);
  } else {
    console.log(`   ❌ Function doesn't work in either case`);
  }
});

console.log('\n\n========== TESTING API CALL ==========\n');

// Test actual API call
async function testAPI() {
  const testInput = 'He said, "I am tired"';
  console.log(`Input: "${testInput}"`);
  
  try {
    const result = await textProcessingService.improveEnglishText(testInput);
    console.log(`API Result: "${result}"`);
    
    if (result.includes('he was tired') || result.includes('he said that')) {
      console.log('✅ API working correctly');
    } else {
      console.log('❌ API not applying corrections');
    }
  } catch (error) {
    console.log('❌ API Error:', error.message);
  }
}

testAPI();
