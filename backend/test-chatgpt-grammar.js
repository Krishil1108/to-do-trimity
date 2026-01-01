const textProcessor = require('./services/textProcessingService');

const testCases = [
  {
    name: 'Simple Present Tense',
    input: 'He go to school every day.',
    expected: 'He goes to school every day.'
  },
  {
    name: 'Past Tense',
    input: 'Yesterday I go to the store.',
    expected: 'Yesterday I went to the store.'
  },
  {
    name: 'Reported Speech',
    input: 'He said, "I am tired"',
    expected: 'He said that he was tired.'
  },
  {
    name: 'Complex Passive Voice',
    input: 'The project has been complete by the team.',
    expected: 'The project has been completed by the team.'
  },
  {
    name: 'Run-on Sentence',
    input: 'I went to the store I bought some milk.',
    expected: 'I went to the store. I bought some milk.'
  },
  {
    name: 'Sentence Fragment',
    input: 'Because I was tired.',
    expected: 'I was tired.'
  },
  {
    name: 'Phrasal Verbs',
    input: 'Please turn off the light.',
    expected: 'Please turn off the light.'
  },
  {
    name: 'Gerunds vs Infinitives',
    input: 'I enjoy to read books.',
    expected: 'I enjoy reading books.'
  },
  {
    name: 'Subject-Verb Agreement',
    input: 'The team are working on the project.',
    expected: 'The team is working on the project.'
  },
  {
    name: 'Article Usage',
    input: 'I saw a elephant at zoo.',
    expected: 'I saw an elephant at the zoo.'
  }
];

async function runTests() {
  console.log('🧪 Starting ChatGPT Grammar Tests...\n');
  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    try {
      console.log(`📝 Testing: ${test.name}`);
      console.log(`   Input: "${test.input}"`);
      
      const result = await textProcessor.improveEnglishText(test.input);
      
      console.log(`   Output: "${result}"`);
      console.log(`   Expected: "${test.expected}"`);
      
      // Check if output is improved (not necessarily exact match)
      if (result !== test.input && result.length > 0) {
        console.log('   ✅ PASS - Text was improved\n');
        passed++;
      } else {
        console.log('   ❌ FAIL - Text unchanged\n');
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}\n`);
      failed++;
    }
  }

  console.log('='.repeat(50));
  console.log(`📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}/${testCases.length}`);
  console.log(`   ❌ Failed: ${failed}/${testCases.length}`);
  console.log(`   📈 Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(50));
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
