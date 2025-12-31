/**
 * ISOLATED MODULE TEST
 * Test each grammar module in isolation WITHOUT LanguageTool
 * This helps identify if regex patterns are working correctly
 */

const service = require('./services/textProcessingService');

console.log('\n==================================================================================');
console.log('🧪 ISOLATED MODULE TESTING');
console.log('Testing each function directly without LanguageTool interference');
console.log('==================================================================================\n');

// Test cases for each module
const tests = [
  {
    category: 'PHRASAL VERBS',
    tests: [
      {
        input: 'Please look at for the keys',
        expected: 'Please look for the keys',
        fn: 'fixPhrasalVerbs'
      },
      {
        input: 'I need to look to after the children',
        expected: 'I need to look after the children',
        fn: 'fixPhrasalVerbs'
      },
      {
        input: 'They gave in up the fight',
        expected: 'They gave up the fight',
        fn: 'fixPhrasalVerbs'
      }
    ]
  },
  {
    category: 'GERUNDS VS INFINITIVES',
    tests: [
      {
        input: 'She wants going to the store',
        expected: 'She wants to go to the store',
        fn: 'fixGerundsVsInfinitives'
      },
      {
        input: 'They finished to work at 5 PM',
        expected: 'They finished working at 5 PM',
        fn: 'fixGerundsVsInfinitives'
      },
      {
        input: 'He decided studying harder',
        expected: 'He decided to study harder',
        fn: 'fixGerundsVsInfinitives'
      },
      {
        input: 'We avoid to make mistakes',
        expected: 'We avoid making mistakes',
        fn: 'fixGerundsVsInfinitives'
      }
    ]
  },
  {
    category: 'SENTENCE FRAGMENTS',
    tests: [
      {
        input: 'Walking down the street.',
        expected: 'I was walking down the street.',
        fn: 'fixSentenceFragments'
      },
      {
        input: 'The report very important.',
        expected: 'The report is very important.',
        fn: 'fixSentenceFragments'
      }
    ]
  },
  {
    category: 'RUN-ON SENTENCES',
    tests: [
      {
        input: 'I went home, I was tired',
        expected: 'I went home, and I was tired',
        fn: 'fixRunOnSentences'
      },
      {
        input: 'She is smart she works hard',
        expected: 'She is smart. She works hard.',
        fn: 'fixRunOnSentences'
      }
    ]
  },
  {
    category: 'PARALLEL STRUCTURE',
    tests: [
      {
        input: 'I like reading, to write, and swimming',
        expected: 'I like reading, writing, and swimming',
        fn: 'fixParallelStructureAdvanced'
      },
      {
        input: 'She enjoys cooking, dancing, and to sing',
        expected: 'She enjoys cooking, dancing, and singing',
        fn: 'fixParallelStructureAdvanced'
      }
    ]
  },
  {
    category: 'COMPLEX PASSIVE',
    tests: [
      {
        input: 'The house is being build',
        expected: 'The house is being built',
        fn: 'fixComplexPassive'
      },
      {
        input: 'It has been complete',
        expected: 'It has been completed',
        fn: 'fixComplexPassive'
      }
    ]
  }
];

let totalTests = 0;
let totalPassed = 0;

tests.forEach(category => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📦 ${category.category}`);
  console.log(`${'='.repeat(80)}\n`);
  
  category.tests.forEach((test, idx) => {
    totalTests++;
    const result = service[test.fn](test.input);
    const passed = result.trim() === test.expected.trim();
    
    if (passed) {
      totalPassed++;
      console.log(`✅ [${idx + 1}/${category.tests.length}] PASS`);
    } else {
      console.log(`❌ [${idx + 1}/${category.tests.length}] FAIL`);
    }
    
    console.log(`   INPUT:    "${test.input}"`);
    console.log(`   EXPECTED: "${test.expected}"`);
    console.log(`   GOT:      "${result}"`);
    
    if (!passed) {
      console.log(`   ⚠️  Difference detected`);
    }
    console.log();
  });
  
  const categoryPassed = category.tests.filter((test, idx) => {
    const result = service[test.fn](test.input);
    return result.trim() === test.expected.trim();
  }).length;
  
  const percentage = ((categoryPassed / category.tests.length) * 100).toFixed(1);
  console.log(`📊 Category Score: ${categoryPassed}/${category.tests.length} (${percentage}%)\n`);
});

console.log('\n==================================================================================');
console.log('📊 ISOLATED TEST RESULTS');
console.log('==================================================================================\n');
console.log(`✅ PASSED: ${totalPassed}/${totalTests} (${((totalPassed/totalTests)*100).toFixed(1)}%)`);
console.log(`❌ FAILED: ${totalTests - totalPassed}/${totalTests} (${(((totalTests - totalPassed)/totalTests)*100).toFixed(1)}%)`);
console.log('\n==================================================================================\n');

if (totalPassed < totalTests * 0.8) {
  console.log('⚠️  WARNING: Less than 80% pass rate');
  console.log('🔧 Functions need debugging - regex patterns may not be matching correctly');
} else {
  console.log('✅ Good performance! Functions are working correctly');
  console.log('💡 If end-to-end tests fail, the issue is with LanguageTool interference');
}
console.log();
