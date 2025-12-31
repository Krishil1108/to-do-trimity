/**
 * Comprehensive Grammar Testing Suite
 * Tests all grammar concepts: tenses, verbs, adjectives, adverbs, conjunctions, 
 * prepositions, punctuation, sentence structure, etc.
 */

const textProcessingService = require('./services/textProcessingService');

// Test cases covering ALL grammar concepts
const grammarTestCases = [
  // TENSE ERRORS
  {
    input: "We was going to meet tomorrow at office",
    expected: "will be going to meet tomorrow",
    category: "Tense - Past with future time marker"
  },
  {
    input: "She were preparing presentation yesterday",
    expected: "was preparing presentation yesterday",
    category: "Tense - Past continuous"
  },
  
  // SUBJECT-VERB AGREEMENT
  {
    input: "John and Sarah was attending the meeting",
    expected: "John and Sarah were attending the meeting",
    category: "Subject-Verb Agreement - Compound subject"
  },
  {
    input: "He are going to office",
    expected: "He is going to office",
    category: "Subject-Verb Agreement - Singular pronoun"
  },
  {
    input: "They was discussing budget",
    expected: "They were discussing budget",
    category: "Subject-Verb Agreement - Plural pronoun"
  },
  
  // IRREGULAR VERBS
  {
    input: "He has went to the bank",
    expected: "He has gone to the bank",
    category: "Irregular Verbs - go/went/gone"
  },
  {
    input: "We have saw the report",
    expected: "We have seen the report",
    category: "Irregular Verbs - see/saw/seen"
  },
  {
    input: "She has did the work",
    expected: "She has done the work",
    category: "Irregular Verbs - do/did/done"
  },
  
  // PRONOUN CASE
  {
    input: "Me and John completed the task",
    expected: "I and John completed the task",
    category: "Pronouns - Subject case"
  },
  {
    input: "Him and her was working together",
    expected: "He and she were working together",
    category: "Pronouns - Subject case multiple"
  },
  
  // PREPOSITIONS
  {
    input: "Meeting is scheduled in Monday",
    expected: "Meeting is scheduled on Monday",
    category: "Prepositions - Days of week"
  },
  {
    input: "We will meet at morning",
    expected: "We will meet in the morning",
    category: "Prepositions - Time of day"
  },
  {
    input: "She is married with John",
    expected: "She is married to John",
    category: "Prepositions - Married to/with"
  },
  
  // ARTICLES (a/an/the)
  {
    input: "He is a engineer working on a unique project",
    expected: "an engineer",
    category: "Articles - a/an usage"
  },
  {
    input: "She bought a apple and a orange",
    expected: "an apple and an orange",
    category: "Articles - Multiple a/an corrections"
  },
  
  // DOUBLE NEGATIVES
  {
    input: "I don't have no time for this",
    expected: "I don't have any time for this",
    category: "Double Negatives - don't...no"
  },
  {
    input: "She didn't see nothing wrong",
    expected: "She didn't see anything wrong",
    category: "Double Negatives - didn't...nothing"
  },
  
  // SPELLING CORRECTIONS
  {
    input: "The goverment will handel the seperate commitee meeting tommorow",
    expected: "government will handle the separate committee meeting tomorrow",
    category: "Spelling - Multiple corrections"
  },
  {
    input: "We need to acheive our definate goals",
    expected: "achieve our definite goals",
    category: "Spelling - Common mistakes"
  },
  
  // PUNCTUATION
  {
    input: "Hello,how are you?I am fine",
    expected: "Hello, how are you? I am fine",
    category: "Punctuation - Spacing"
  },
  {
    input: "We discussed budget,timeline,resources",
    expected: "We discussed budget, timeline, resources",
    category: "Punctuation - List commas"
  },
  {
    input: "The meeting was good However we need more time",
    expected: "The meeting was good. However, we need more time",
    category: "Punctuation - Sentence separation"
  },
  
  // ADJECTIVE ORDER
  {
    input: "She bought a blue big car",
    expected: "She bought a big blue car",
    category: "Adjective Order - Size before color"
  },
  
  // SENTENCE STRUCTURE
  {
    input: "the meeting started late everyone was present",
    expected: "The meeting started late. Everyone was present",
    category: "Sentence Structure - Capitalization and separation"
  },
  
  // COMPLEX EXAMPLE
  {
    input: "me and him was going to discus abot the budjet in monday at morning the meeting was handel by commitee",
    expected: "discuss about the budget on Monday in the morning",
    category: "Complex - Multiple grammar errors"
  },
  
  // PROFESSIONAL LANGUAGE
  {
    input: "pls send the report asap thanks btw we need it today",
    expected: "please send the report as soon as possible Thank you by the way we need it today",
    category: "Professional Language - Abbreviations"
  }
];

async function runGrammarTests() {
  console.log('🧪 Starting Comprehensive Grammar Tests\n');
  console.log('=' .repeat(80));
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of grammarTestCases) {
    try {
      console.log(`\n📝 Testing: ${testCase.category}`);
      console.log(`Input:    "${testCase.input}"`);
      
      const result = await textProcessingService.processMOMText(testCase.input);
      const output = result.final;
      
      console.log(`Output:   "${output}"`);
      console.log(`Expected: "${testCase.expected}"`);
      
      // Check if expected text appears in output (flexible matching)
      const containsExpected = output.toLowerCase().includes(testCase.expected.toLowerCase());
      
      if (containsExpected) {
        console.log('✅ PASSED');
        passed++;
      } else {
        console.log('❌ FAILED - Expected text not found in output');
        failed++;
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      failed++;
    }
    
    console.log('-'.repeat(80));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}/${grammarTestCases.length}`);
  console.log(`   ❌ Failed: ${failed}/${grammarTestCases.length}`);
  console.log(`   📈 Success Rate: ${((passed/grammarTestCases.length) * 100).toFixed(1)}%`);
  console.log('\n' + '='.repeat(80));
}

// Additional detailed test for specific grammar concepts
async function testSpecificGrammarConcepts() {
  console.log('\n\n🔍 Detailed Grammar Concept Tests\n');
  
  const concepts = [
    {
      name: "VERB TENSES",
      tests: [
        "Yesterday I am going to the store",
        "Tomorrow we was having a meeting",
        "He will went to office next week"
      ]
    },
    {
      name: "SUBJECT-VERB AGREEMENT",
      tests: [
        "She don't like coffee",
        "They was happy",
        "The team are working hard"
      ]
    },
    {
      name: "PRONOUNS",
      tests: [
        "Me and Sarah completed it",
        "Him and me was working",
        "Give it to I"
      ]
    },
    {
      name: "PREPOSITIONS",
      tests: [
        "Born in July 4th",
        "Arrive to the station",
        "Different than others"
      ]
    },
    {
      name: "ARTICLES",
      tests: [
        "I need a advice",
        "He is a honest man",
        "She bought a umbrella"
      ]
    }
  ];
  
  for (const concept of concepts) {
    console.log(`\n📚 ${concept.name}`);
    console.log('─'.repeat(60));
    
    for (const test of concept.tests) {
      const result = await textProcessingService.processMOMText(test);
      console.log(`Before: ${test}`);
      console.log(`After:  ${result.final}`);
      console.log('');
    }
  }
}

// Run all tests
(async () => {
  try {
    await runGrammarTests();
    await testSpecificGrammarConcepts();
    
    console.log('\n✨ Testing complete!\n');
  } catch (error) {
    console.error('❌ Test suite error:', error);
  }
})();
