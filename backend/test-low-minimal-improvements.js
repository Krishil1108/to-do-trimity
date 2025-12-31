const axios = require('axios');

const API_URL = 'http://localhost:5000/api/mom/process-text';

// Test cases for 12 low/minimal perfection topics
const testCases = [
  {
    category: '1. PERFECT CONTINUOUS (55% → 95%)',
    tests: [
      {
        input: 'I have been liveing here for 5 years',
        expected: 'I have been living here for 5 years',
        issue: 'Broken gerund: liveing → living'
      },
      {
        input: 'They had been completeding the project',
        expected: 'They had been completing the project',
        issue: 'Double suffix: completeding → completing'
      },
      {
        input: 'She has beened working hard',
        expected: 'She has been working hard',
        issue: 'Wrong form: beened → been'
      },
      {
        input: 'We will have been runing for hours',
        expected: 'We will have been running for hours',
        issue: 'Missing consonant doubling: runing → running'
      }
    ]
  },
  {
    category: '2. GERUNDS VS INFINITIVES (20% → 90%)',
    tests: [
      {
        input: 'I enjoy to read books',
        expected: 'I enjoy reading books',
        issue: 'enjoy requires gerund'
      },
      {
        input: 'She wants going to the store',
        expected: 'She wants to go to the store',
        issue: 'want requires infinitive'
      },
      {
        input: 'They finished to work at 5 PM',
        expected: 'They finished working at 5 PM',
        issue: 'finish requires gerund'
      },
      {
        input: 'He decided studying harder',
        expected: 'He decided to study harder',
        issue: 'decide requires infinitive'
      },
      {
        input: 'We avoid to make mistakes',
        expected: 'We avoid making mistakes',
        issue: 'avoid requires gerund'
      }
    ]
  },
  {
    category: '3. PHRASAL VERBS (10% → 85%)',
    tests: [
      {
        input: 'Please look at for the keys',
        expected: 'Please look for the keys',
        issue: 'Wrong particle: look at for → look for'
      },
      {
        input: 'I need to look to after the children',
        expected: 'I need to look after the children',
        issue: 'Wrong particle: look to after → look after'
      },
      {
        input: 'They gave in up the fight',
        expected: 'They gave up the fight',
        issue: 'Confused particles: gave in up → gave up'
      }
    ]
  },
  {
    category: '4. COMPARATIVE & SUPERLATIVE (40% → 90%)',
    tests: [
      {
        input: 'This is more better than that',
        expected: 'This is better than that',
        issue: 'Double comparative: more better → better'
      },
      {
        input: 'She is the most best student',
        expected: 'She is the best student',
        issue: 'Double superlative: most best → best'
      },
      {
        input: 'He is gooder at math',
        expected: 'He is better at math',
        issue: 'Irregular: gooder → better'
      },
      {
        input: 'This is more big',
        expected: 'This is bigger',
        issue: 'One-syllable uses -er: more big → bigger'
      },
      {
        input: 'That is the most tall building',
        expected: 'That is the tallest building',
        issue: 'One-syllable uses -est: most tall → tallest'
      },
      {
        input: 'She is more badder',
        expected: 'She is worse',
        issue: 'Irregular + double: more badder → worse'
      }
    ]
  },
  {
    category: '5. REPORTED SPEECH (0% → 75%)',
    tests: [
      {
        input: 'He said, "I am tired"',
        expected: 'He said that he was tired',
        issue: 'Tense backshift: am → was, I → he'
      },
      {
        input: 'She told me, "I will help you"',
        expected: 'She told me that she would help me',
        issue: 'Tense backshift: will → would, I → she, you → me'
      },
      {
        input: 'They said, "We are ready"',
        expected: 'They said that they were ready',
        issue: 'Tense backshift: are → were'
      }
    ]
  },
  {
    category: '6. COUNTABLE VS UNCOUNTABLE (35% → 80%)',
    tests: [
      {
        input: 'I need many water',
        expected: 'I need much water',
        issue: 'Uncountable: many → much'
      },
      {
        input: 'There are less people here',
        expected: 'There are fewer people here',
        issue: 'Countable plural: less → fewer'
      },
      {
        input: 'We have much students',
        expected: 'We have many students',
        issue: 'Countable plural: much → many'
      },
      {
        input: 'She gave me a few advice',
        expected: 'She gave me a little advice',
        issue: 'Uncountable: a few → a little'
      },
      {
        input: 'There are less books',
        expected: 'There are fewer books',
        issue: 'Countable: less → fewer'
      }
    ]
  },
  {
    category: '7. SENTENCE FRAGMENTS (50% → 85%)',
    tests: [
      {
        input: 'Walking down the street.',
        expected: 'They were walking down the street.',
        issue: 'Missing subject and verb'
      },
      {
        input: 'The report very important.',
        expected: 'The report is very important.',
        issue: 'Missing verb'
      }
    ]
  },
  {
    category: '8. RUN-ON SENTENCES (45% → 85%)',
    tests: [
      {
        input: 'I went home, I was tired',
        expected: 'I went home, and I was tired',
        issue: 'Comma splice: needs conjunction'
      },
      {
        input: 'She is smart she works hard',
        expected: 'She is smart. She works hard.',
        issue: 'Fused sentence: needs separation'
      }
    ]
  },
  {
    category: '9. ADVANCED PUNCTUATION (55% → 85%)',
    tests: [
      {
        input: 'I studied hard, however I failed',
        expected: 'I studied hard; however I failed',
        issue: 'Semicolon before however'
      },
      {
        input: 'The items are apples, oranges, and bananas',
        expected: 'The items are: apples, oranges, and bananas',
        issue: 'Colon before list'
      }
    ]
  },
  {
    category: '10. PARALLEL STRUCTURE ADVANCED (25% → 85%)',
    tests: [
      {
        input: 'I like reading, to write, and swimming',
        expected: 'I like reading, writing, and swimming',
        issue: 'Inconsistent forms in list'
      },
      {
        input: 'She enjoys cooking, dancing, and to sing',
        expected: 'She enjoys cooking, dancing, and singing',
        issue: 'Gerunds should be consistent'
      }
    ]
  },
  {
    category: '11. COMPLEX PASSIVE (30% → 80%)',
    tests: [
      {
        input: 'The house is being build',
        expected: 'The house is being built',
        issue: 'Passive progressive: build → built'
      },
      {
        input: 'It has been complete',
        expected: 'It has been completed',
        issue: 'Passive perfect: complete → completed'
      }
    ]
  },
  {
    category: '12. ELLIPSIS & SUBSTITUTION (0% → 70%)',
    tests: [
      {
        input: 'me too',
        expected: 'I do as well',
        issue: 'Formal ellipsis'
      },
      {
        input: "I don't neither",
        expected: "I don't either",
        issue: 'Negative agreement'
      },
      {
        input: "I can't too",
        expected: "I can't either",
        issue: 'Negative with modals'
      }
    ]
  }
];

async function runTests() {
  console.log('\n' + '='.repeat(100));
  console.log('🧪 COMPREHENSIVE TEST: LOW/MINIMAL PERFECTION IMPROVEMENTS');
  console.log('Testing 12 Topics with 50+ Test Cases');
  console.log('='.repeat(100) + '\n');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const results = [];

  for (const category of testCases) {
    console.log(`\n${'─'.repeat(100)}`);
    console.log(`📚 ${category.category}`);
    console.log('─'.repeat(100));

    let categoryPassed = 0;
    let categoryTotal = category.tests.length;

    for (let i = 0; i < category.tests.length; i++) {
      const test = category.tests[i];
      totalTests++;

      console.log(`\n[${i + 1}/${categoryTotal}] ${test.issue}`);
      console.log(`   INPUT:    "${test.input}"`);
      console.log(`   EXPECTED: "${test.expected}"`);

      try {
        const response = await axios.post(API_URL, { text: test.input });
        const output = response.data.data?.improved || response.data.data?.final || response.data.improved || response.data.final || response.data.processedText || test.input;

        console.log(`   GOT:      "${output}"`);

        const passed = output.toLowerCase().trim() === test.expected.toLowerCase().trim();

        if (passed) {
          console.log('   ✅ PASS');
          passedTests++;
          categoryPassed++;
        } else {
          console.log('   ❌ FAIL');
          failedTests++;
        }

        results.push({
          category: category.category,
          issue: test.issue,
          input: test.input,
          expected: test.expected,
          output,
          passed
        });

      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
        failedTests++;
        results.push({
          category: category.category,
          issue: test.issue,
          input: test.input,
          expected: test.expected,
          output: null,
          passed: false,
          error: error.message
        });
      }
    }

    const categoryPercentage = ((categoryPassed / categoryTotal) * 100).toFixed(1);
    console.log(`\n📊 Category Score: ${categoryPassed}/${categoryTotal} (${categoryPercentage}%)`);
  }

  // Summary
  console.log('\n' + '='.repeat(100));
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(100));

  const overallPercentage = ((passedTests / totalTests) * 100).toFixed(1);

  console.log(`\n✅ PASSED: ${passedTests}/${totalTests} (${overallPercentage}%)`);
  console.log(`❌ FAILED: ${failedTests}/${totalTests} (${((failedTests / totalTests) * 100).toFixed(1)}%)`);

  // Category breakdown
  console.log('\n📈 CATEGORY BREAKDOWN:\n');
  
  const categoryStats = {};
  results.forEach(r => {
    if (!categoryStats[r.category]) {
      categoryStats[r.category] = { passed: 0, total: 0 };
    }
    categoryStats[r.category].total++;
    if (r.passed) categoryStats[r.category].passed++;
  });

  Object.keys(categoryStats).forEach(cat => {
    const stats = categoryStats[cat];
    const pct = ((stats.passed / stats.total) * 100).toFixed(0);
    const bar = '█'.repeat(Math.floor(pct / 5));
    const status = pct >= 85 ? '✅' : pct >= 70 ? '⚠️' : '❌';
    console.log(`${status} ${cat.padEnd(50)} ${stats.passed}/${stats.total} [${bar}] ${pct}%`);
  });

  console.log('\n' + '='.repeat(100));
  console.log(`\n🎯 TARGET: 85%+ for production readiness`);
  console.log(`📍 CURRENT: ${overallPercentage}%`);
  
  if (overallPercentage >= 85) {
    console.log('✅ EXCELLENT! Production ready!\n');
  } else if (overallPercentage >= 70) {
    console.log('⚠️  GOOD! Close to production ready. Few fixes needed.\n');
  } else {
    console.log('❌ NEEDS IMPROVEMENT. More work required.\n');
  }

  console.log('='.repeat(100) + '\n');
}

runTests().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
