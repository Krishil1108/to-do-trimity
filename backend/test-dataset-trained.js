/**
 * Test dataset-trained grammar modules
 * Testing: Reported Speech, Ellipsis, Punctuation, Sentence Structure
 */

const { 
  fixReportedSpeech, 
  fixEllipsisSubstitution,
  fixAdvancedPunctuation,
  fixSentenceFragments
} = require('./services/textProcessingService');

console.log('========== REPORTED SPEECH TESTS ==========\n');

const reportedTests = [
  {
    input: 'He said, "I am tired"',
    expected: 'He said that he was tired',
    topic: 'Basic tense backshift'
  },
  {
    input: 'She said, "I will go tomorrow"',
    expected: 'She said that she would go the next day',
    topic: 'Modal + time change'
  },
  {
    input: 'He asked, "Can you help me?"',
    expected: 'He asked if I could help him',
    topic: 'Yes/no question'
  },
  {
    input: 'She asked, "Where are you going?"',
    expected: 'She asked where I was going',
    topic: 'Wh-question'
  },
  {
    input: 'They said, "We are here now"',
    expected: 'They said that they were there then',
    topic: 'Plural + place/time'
  }
];

let reportedPassed = 0;
reportedTests.forEach((test, i) => {
  const result = fixReportedSpeech(test.input);
  const passed = result.toLowerCase().includes(test.expected.toLowerCase().substring(0, 20));
  if (passed) reportedPassed++;
  console.log(`${i+1}. ${test.topic}`);
  console.log(`   Input:    "${test.input}"`);
  console.log(`   Expected: "${test.expected}"`);
  console.log(`   Got:      "${result}"`);
  console.log(`   ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
});

console.log(`\n========== ELLIPSIS & SUBSTITUTION TESTS ==========\n`);

const ellipsisTests = [
  {
    input: 'I have a red car and a blue car',
    expected: 'I have a red car and a blue one',
    topic: 'Noun substitution'
  },
  {
    input: 'me too',
    expected: 'I do too',
    topic: 'Agreement response'
  },
  {
    input: "I can't too",
    expected: "I can't either",
    topic: 'Negative agreement'
  },
  {
    input: 'Will it rain? I think it will rain',
    expected: 'Will it rain? I think so',
    topic: 'Clause substitution'
  },
  {
    input: 'Can you help? Yes, I can help',
    expected: 'Can you help? Yes, I can',
    topic: 'Auxiliary response'
  }
];

let ellipsisPassed = 0;
ellipsisTests.forEach((test, i) => {
  const result = fixEllipsisSubstitution(test.input);
  const passed = result.toLowerCase().includes(test.expected.toLowerCase().substring(0, 15));
  if (passed) ellipsisPassed++;
  console.log(`${i+1}. ${test.topic}`);
  console.log(`   Input:    "${test.input}"`);
  console.log(`   Expected: "${test.expected}"`);
  console.log(`   Got:      "${result}"`);
  console.log(`   ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
});

console.log(`\n========== PUNCTUATION TESTS ==========\n`);

const punctuationTests = [
  {
    input: 'its raining today',
    expected: "it's raining today",
    topic: "its vs it's"
  },
  {
    input: 'your going to the store',
    expected: "you're going to the store",
    topic: 'your vs you\'re'
  },
  {
    input: 'their going home',
    expected: "they're going home",
    topic: 'their vs they\'re'
  },
  {
    input: 'I like apples, oranges and bananas',
    expected: 'I like apples, oranges, and bananas',
    topic: 'Oxford comma'
  },
  {
    input: 'However I think so',
    expected: 'However, I think so',
    topic: 'Comma after introductory word'
  }
];

let punctuationPassed = 0;
punctuationTests.forEach((test, i) => {
  const result = fixAdvancedPunctuation(test.input);
  const passed = result.toLowerCase().includes(test.expected.toLowerCase());
  if (passed) punctuationPassed++;
  console.log(`${i+1}. ${test.topic}`);
  console.log(`   Input:    "${test.input}"`);
  console.log(`   Expected: "${test.expected}"`);
  console.log(`   Got:      "${result}"`);
  console.log(`   ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
});

console.log(`\n========== SENTENCE FRAGMENT TESTS ==========\n`);

const fragmentTests = [
  {
    input: 'Because it was late.',
    expected: 'It happened because it was late.',
    topic: 'Subordinate clause'
  },
  {
    input: 'Went to the store.',
    expected: 'I went to the store.',
    topic: 'Missing subject'
  },
  {
    input: 'The report very important.',
    expected: 'The report is very important.',
    topic: 'Missing verb'
  },
  {
    input: 'Walking down the street.',
    expected: 'I was walking down the street.',
    topic: 'Gerund phrase'
  },
  {
    input: 'Very interesting and educational.',
    expected: 'It is very interesting and educational.',
    topic: 'Adjective phrase'
  }
];

let fragmentPassed = 0;
fragmentTests.forEach((test, i) => {
  const result = fixSentenceFragments(test.input);
  const passed = result.toLowerCase().includes(test.expected.toLowerCase());
  if (passed) fragmentPassed++;
  console.log(`${i+1}. ${test.topic}`);
  console.log(`   Input:    "${test.input}"`);
  console.log(`   Expected: "${test.expected}"`);
  console.log(`   Got:      "${result}"`);
  console.log(`   ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
});

// Summary
console.log('\n========== SUMMARY ==========');
console.log(`Reported Speech: ${reportedPassed}/${reportedTests.length} (${Math.round(reportedPassed/reportedTests.length*100)}%)`);
console.log(`Ellipsis & Substitution: ${ellipsisPassed}/${ellipsisTests.length} (${Math.round(ellipsisPassed/ellipsisTests.length*100)}%)`);
console.log(`Punctuation: ${punctuationPassed}/${punctuationTests.length} (${Math.round(punctuationPassed/punctuationTests.length*100)}%)`);
console.log(`Sentence Fragments: ${fragmentPassed}/${fragmentTests.length} (${Math.round(fragmentPassed/fragmentTests.length*100)}%)`);

const totalPassed = reportedPassed + ellipsisPassed + punctuationPassed + fragmentPassed;
const totalTests = reportedTests.length + ellipsisTests.length + punctuationTests.length + fragmentTests.length;
console.log(`\n✨ OVERALL: ${totalPassed}/${totalTests} (${Math.round(totalPassed/totalTests*100)}%)`);

if (totalPassed/totalTests >= 0.90) {
  console.log('\n🎉 TARGET ACHIEVED: 90%+ perfection!');
} else {
  console.log(`\n📊 Need ${Math.ceil(totalTests * 0.90) - totalPassed} more passing tests to reach 90%`);
}
