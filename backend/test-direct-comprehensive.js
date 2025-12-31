/**
 * Comprehensive test calling textProcessingService directly (not through HTTP)
 * This tests the actual current code, not a running server
 */

const textProcessingService = require('./services/textProcessingService');

console.log('========== COMPREHENSIVE DIRECT TEST ==========\n');

const tests = {
  'Reported Speech': [
    { input: 'He said, "I am tired"', expected: 'he was tired' },
    { input: 'She told me, "I will help you"', expected: 'she would help me' },
  ],
  'Complex Passive': [
    { input: 'The house is being build', expected: 'being built' },
    { input: 'It has been complete', expected: 'been completed' },
  ],
  'Run-on Sentences': [
    { input: 'I went home, I was tired', expected: ', and I was tired' },
    { input: 'She is smart she works hard', expected: 'smart. She works' },
  ],
  'Sentence Fragments': [
    { input: 'Walking down the street.', expected: 'I was walking' },
    { input: 'The report very important.', expected: 'report is very important' },
  ],
  'Phrasal Verbs': [
    { input: 'Please look at for the keys', expected: 'look for the keys' },
    { input: 'I need to look to after the children', expected: 'look after the children' },
  ],
  'Gerunds vs Infinitives': [
    { input: 'I enjoy to read books', expected: 'enjoy reading books' },
    { input: 'She wants going to the store', expected: 'wants to go' },
  ],
  'Punctuation': [
    { input: 'its raining today', expected: "it's raining" },
    { input: 'your going home', expected: "you're going" },
  ],
  'Ellipsis & Substitution': [
    { input: 'me too', expected: 'I do too' },
    { input: "I can't too", expected: "can't either" },
  ]
};

async function runTests() {
  let totalPassed = 0;
  let totalTests = 0;
  
  for (const [category, testCases] of Object.entries(tests)) {
    console.log(`\n========== ${category} ==========`);
    let categoryPassed = 0;
    
    for (const test of testCases) {
      totalTests++;
      const result = await textProcessingService.improveEnglishText(test.input);
      const passed = result.toLowerCase().includes(test.expected.toLowerCase());
      
      if (passed) {
        categoryPassed++;
        totalPassed++;
        console.log(`✅ "${test.input.substring(0, 40)}..."`);
      } else {
        console.log(`❌ "${test.input.substring(0, 40)}..."`);
        console.log(`   Expected: "${test.expected}"`);
        console.log(`   Got: "${result}"`);
      }
    }
    
    const percentage = Math.round((categoryPassed / testCases.length) * 100);
    console.log(`   Score: ${categoryPassed}/${testCases.length} (${percentage}%)`);
  }
  
  console.log(`\n========== FINAL RESULTS ==========`);
  console.log(`Total: ${totalPassed}/${totalTests} (${Math.round((totalPassed/totalTests)*100)}%)`);
  
  if (totalPassed / totalTests >= 0.90) {
    console.log('🎉 TARGET ACHIEVED: 90%+ perfection!');
  } else if (totalPassed / totalTests >= 0.80) {
    console.log('⚠️  Good progress: 80%+ perfection');
  } else {
    console.log(`❌ Need ${Math.ceil(totalTests * 0.90) - totalPassed} more passing tests to reach 90%`);
  }
}

runTests();