/**
 * Direct API Test - Check if grammar functions are actually executing
 */

const service = require('./services/textProcessingService');

console.log('========== DIRECT API TEST ==========\n');

const testCases = [
  {
    input: 'He said, "I am tired"',
    topic: 'Reported Speech',
    expected: 'said that he was'
  },
  {
    input: 'Please look at for the keys',
    topic: 'Phrasal Verbs',
    expected: 'look for the keys'
  },
  {
    input: 'The house is being build',
    topic: 'Complex Passive',
    expected: 'being built'
  },
  {
    input: 'I went home, I was tired',
    topic: 'Run-on Sentences',
    expected: 'home, and I was'
  },
  {
    input: 'Walking down the street.',
    topic: 'Sentence Fragments',
    expected: 'I was walking'
  }
];

async function runTests() {
  let passed = 0;
  
  for (const test of testCases) {
    console.log(`Testing: ${test.topic}`);
    console.log(`Input:    "${test.input}"`);
    
    try {
      const result = await service.processMOMText(test.input);
      const output = result.improved || result.final;
      
      const success = output.toLowerCase().includes(test.expected.toLowerCase());
      
      console.log(`Expected: "${test.expected}"`);
      console.log(`Got:      "${output}"`);
      console.log(success ? '✅ PASS\n' : '❌ FAIL\n');
      
      if (success) passed++;
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}\n`);
    }
  }
  
  console.log(`\n========== RESULTS ==========`);
  console.log(`Passed: ${passed}/${testCases.length} (${Math.round(passed/testCases.length*100)}%)`);
  
  if (passed < testCases.length) {
    console.log('\n⚠️ API is not executing grammar functions properly');
    console.log('Checking if improveEnglishText is being called...');
  } else {
    console.log('\n✅ API is working correctly!');
  }
}

runTests().catch(console.error);
