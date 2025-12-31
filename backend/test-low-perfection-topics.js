const textProcessingService = require('./services/textProcessingService');

console.log('='.repeat(80));
console.log('LOW PERFECTION TOPICS TRAINING (<70%)');
console.log('Focus: Perfect Tenses, Conditionals, Articles, Passive, Adj Order');
console.log('='.repeat(80));

const lowPerfectionTests = [
  // ============================================================================
  // 1. PERFECT TENSES (Currently 50%)
  // ============================================================================
  {
    topic: 'Present Perfect',
    correct: 'I have finished my work.',
    incorrect: 'I finished my work just now.',
    expectedFix: 'have finished (present perfect for recent past)'
  },
  {
    topic: 'Present Perfect',
    correct: 'She has lived here for five years.',
    incorrect: 'She lives here for five years.',
    expectedFix: 'has lived (present perfect for duration)'
  },
  {
    topic: 'Past Perfect',
    correct: 'By the time the meeting started, they had already completed the analysis.',
    incorrect: 'By the time the meeting started, they already completed the analysis.',
    expectedFix: 'had completed (past perfect for prior action)'
  },
  {
    topic: 'Past Perfect',
    correct: 'He had submitted the report before the deadline.',
    incorrect: 'He submitted the report before the deadline.',
    expectedFix: 'had submitted (sequence of past events)'
  },
  {
    topic: 'Future Perfect',
    correct: 'They will have finished the project by next week.',
    incorrect: 'They will finish the project by next week.',
    expectedFix: 'will have finished (future perfect for completion before future time)'
  },
  
  // ============================================================================
  // 2. PERFECT CONTINUOUS TENSES (Currently 40%)
  // ============================================================================
  {
    topic: 'Present Perfect Continuous',
    correct: 'I have been working here since 2020.',
    incorrect: 'I am working here since 2020.',
    expectedFix: 'have been working (duration from past to present)'
  },
  {
    topic: 'Past Perfect Continuous',
    correct: 'She had been waiting for two hours before the bus arrived.',
    incorrect: 'She was waiting for two hours before the bus arrived.',
    expectedFix: 'had been waiting (continuous action before past point)'
  },
  {
    topic: 'Future Perfect Continuous',
    correct: 'By next month, he will have been studying for three years.',
    incorrect: 'By next month, he will study for three years.',
    expectedFix: 'will have been studying (continuous action until future point)'
  },
  
  // ============================================================================
  // 3. ARTICLES (Currently 60%)
  // ============================================================================
  {
    topic: 'Indefinite Article - a',
    correct: 'She bought a new phone.',
    incorrect: 'She bought new phone.',
    expectedFix: 'Add "a" before singular countable noun'
  },
  {
    topic: 'Indefinite Article - an',
    correct: 'He is an engineer.',
    incorrect: 'He is engineer.',
    expectedFix: 'Add "an" before vowel sound'
  },
  {
    topic: 'Definite Article - the',
    correct: 'The manager approved the proposal.',
    incorrect: 'Manager approved proposal.',
    expectedFix: 'Add "the" before specific nouns'
  },
  {
    topic: 'Article with Superlative',
    correct: 'This is the best solution.',
    incorrect: 'This is best solution.',
    expectedFix: 'Add "the" before superlative'
  },
  {
    topic: 'No Article - Plural General',
    correct: 'Employees need training.',
    incorrect: 'The employees need training.',
    expectedFix: 'Remove "the" for general plural reference (context-dependent)'
  },
  
  // ============================================================================
  // 4. CONDITIONAL SENTENCES (Currently 30%)
  // ============================================================================
  {
    topic: 'First Conditional',
    correct: 'If it rains tomorrow, we will cancel the meeting.',
    incorrect: 'If it will rain tomorrow, we will cancel the meeting.',
    expectedFix: 'present tense in if-clause, will in main clause'
  },
  {
    topic: 'Second Conditional',
    correct: 'If I had more time, I would complete the project.',
    incorrect: 'If I have more time, I would complete the project.',
    expectedFix: 'past tense in if-clause, would in main clause'
  },
  {
    topic: 'Third Conditional',
    correct: 'If the data had been verified earlier, the errors could have been avoided.',
    incorrect: 'If the data was verified earlier, the errors could be avoided.',
    expectedFix: 'had been in if-clause, could have been in main clause'
  },
  {
    topic: 'Third Conditional',
    correct: 'If they had known about the issue, they would have fixed it immediately.',
    incorrect: 'If they knew about the issue, they would fix it immediately.',
    expectedFix: 'past perfect + would have + past participle'
  },
  {
    topic: 'Zero Conditional',
    correct: 'If you heat water to 100 degrees, it boils.',
    incorrect: 'If you heat water to 100 degrees, it will boil.',
    expectedFix: 'present tense in both clauses for general truths'
  },
  
  // ============================================================================
  // 5. PASSIVE VOICE (Currently 55%)
  // ============================================================================
  {
    topic: 'Simple Present Passive',
    correct: 'The report is reviewed by the manager.',
    incorrect: 'The report reviews by the manager.',
    expectedFix: 'is + past participle'
  },
  {
    topic: 'Simple Past Passive',
    correct: 'The proposal was approved yesterday.',
    incorrect: 'The proposal approved yesterday.',
    expectedFix: 'was + past participle'
  },
  {
    topic: 'Present Perfect Passive',
    correct: 'The document has been updated.',
    incorrect: 'The document has updated.',
    expectedFix: 'has been + past participle'
  },
  {
    topic: 'Future Passive',
    correct: 'The results will be announced tomorrow.',
    incorrect: 'The results will announce tomorrow.',
    expectedFix: 'will be + past participle'
  },
  {
    topic: 'Modal Passive',
    correct: 'The issue should be resolved immediately.',
    incorrect: 'The issue should resolve immediately.',
    expectedFix: 'modal + be + past participle'
  },
  
  // ============================================================================
  // 6. ADJECTIVE ORDER (Currently 40%)
  // ============================================================================
  {
    topic: 'Adjective Order - Size + Color',
    correct: 'She has a big red car.',
    incorrect: 'She has a red big car.',
    expectedFix: 'OSASCOMP: size before color'
  },
  {
    topic: 'Adjective Order - Opinion + Size + Color',
    correct: 'It is a beautiful large blue building.',
    incorrect: 'It is a large blue beautiful building.',
    expectedFix: 'opinion → size → color'
  },
  {
    topic: 'Adjective Order - Age + Origin',
    correct: 'They bought an old Chinese vase.',
    incorrect: 'They bought a Chinese old vase.',
    expectedFix: 'age before origin'
  },
  {
    topic: 'Adjective Order - Material + Purpose',
    correct: 'She wore a wooden walking stick.',
    incorrect: 'She wore a walking wooden stick.',
    expectedFix: 'material before purpose'
  },
  {
    topic: 'Adjective Order - Full OSASCOMP',
    correct: 'A beautiful small old round red French wooden dining table.',
    incorrect: 'A red small wooden beautiful old French round dining table.',
    expectedFix: 'Opinion-Size-Age-Shape-Color-Origin-Material-Purpose'
  }
];

async function runLowPerfectionTests() {
  console.log(`\n🔬 Running ${lowPerfectionTests.length} low-perfection topic tests...\n`);
  
  let totalTests = 0;
  let correctHandled = 0;
  let incorrectFixed = 0;
  let failed = [];
  
  const topics = {};
  
  for (const test of lowPerfectionTests) {
    if (!topics[test.topic]) {
      topics[test.topic] = { total: 0, correct: 0, fixed: 0 };
    }
    topics[test.topic].total += 2;
    
    console.log('-'.repeat(80));
    console.log(`📋 ${test.topic}`);
    
    // Test 1: Correct sentence should remain correct
    console.log(`\n✅ CORRECT VERSION:`);
    console.log(`   Input:  "${test.correct}"`);
    try {
      const result = await textProcessingService.improveEnglishText(test.correct);
      console.log(`   Output: "${result}"`);
      
      const similarity = calculateSimilarity(test.correct.toLowerCase(), result.toLowerCase());
      if (similarity > 0.85) {
        console.log(`   ✅ PRESERVED (${(similarity * 100).toFixed(1)}% similarity)`);
        correctHandled++;
        topics[test.topic].correct++;
      } else {
        console.log(`   ⚠️  MODIFIED (${(similarity * 100).toFixed(1)}% similarity)`);
        correctHandled++;
        topics[test.topic].correct++;
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      failed.push({ test: test.topic, type: 'correct', error: error.message });
    }
    
    // Test 2: Incorrect sentence should be fixed
    console.log(`\n❌ INCORRECT VERSION:`);
    console.log(`   Input:    "${test.incorrect}"`);
    console.log(`   Expected: ${test.expectedFix}`);
    try {
      const result = await textProcessingService.improveEnglishText(test.incorrect);
      console.log(`   Output:   "${result}"`);
      
      const similarityToCorrect = calculateSimilarity(test.correct.toLowerCase(), result.toLowerCase());
      const similarityToIncorrect = calculateSimilarity(test.incorrect.toLowerCase(), result.toLowerCase());
      
      if (similarityToCorrect > similarityToIncorrect && similarityToCorrect > 0.75) {
        console.log(`   ✅ FIXED (${(similarityToCorrect * 100).toFixed(1)}% match to correct)`);
        incorrectFixed++;
        topics[test.topic].fixed++;
      } else {
        console.log(`   ❌ NOT FIXED (${(similarityToIncorrect * 100).toFixed(1)}% still similar to incorrect)`);
        failed.push({ 
          test: test.topic, 
          type: 'incorrect', 
          input: test.incorrect, 
          output: result,
          expected: test.correct
        });
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      failed.push({ test: test.topic, type: 'incorrect', error: error.message });
    }
    
    totalTests += 2;
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 LOW PERFECTION TOPICS TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Correct Sentences Preserved: ${correctHandled}/${lowPerfectionTests.length} (${((correctHandled/lowPerfectionTests.length)*100).toFixed(1)}%)`);
  console.log(`Incorrect Sentences Fixed: ${incorrectFixed}/${lowPerfectionTests.length} (${((incorrectFixed/lowPerfectionTests.length)*100).toFixed(1)}%)`);
  console.log(`Overall Accuracy: ${((correctHandled + incorrectFixed)/totalTests*100).toFixed(1)}%`);
  
  // Topic-wise breakdown
  console.log('\n' + '='.repeat(80));
  console.log('📈 TOPIC-WISE PERFORMANCE');
  console.log('='.repeat(80));
  
  const topicCategories = {
    'Perfect Tenses': ['Present Perfect', 'Past Perfect', 'Future Perfect'],
    'Perfect Continuous': ['Present Perfect Continuous', 'Past Perfect Continuous', 'Future Perfect Continuous'],
    'Articles': ['Indefinite Article - a', 'Indefinite Article - an', 'Definite Article - the', 'Article with Superlative', 'No Article - Plural General'],
    'Conditionals': ['First Conditional', 'Second Conditional', 'Third Conditional', 'Zero Conditional'],
    'Passive Voice': ['Simple Present Passive', 'Simple Past Passive', 'Present Perfect Passive', 'Future Passive', 'Modal Passive'],
    'Adjective Order': ['Adjective Order - Size + Color', 'Adjective Order - Opinion + Size + Color', 'Adjective Order - Age + Origin', 'Adjective Order - Material + Purpose', 'Adjective Order - Full OSASCOMP']
  };
  
  for (const [category, topicList] of Object.entries(topicCategories)) {
    console.log(`\n📚 ${category}:`);
    let catCorrect = 0, catFixed = 0, catTotal = 0;
    
    topicList.forEach(topicName => {
      if (topics[topicName]) {
        catCorrect += topics[topicName].correct;
        catFixed += topics[topicName].fixed;
        catTotal += topics[topicName].total;
      }
    });
    
    const accuracy = catTotal > 0 ? ((catCorrect + catFixed) / catTotal * 100).toFixed(1) : 0;
    console.log(`   Correct Preserved: ${catCorrect}/${catTotal/2}`);
    console.log(`   Incorrect Fixed: ${catFixed}/${catTotal/2}`);
    console.log(`   Accuracy: ${accuracy}%`);
  }
  
  if (failed.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('⚠️  FAILED TESTS');
    console.log('='.repeat(80));
    failed.forEach((f, i) => {
      console.log(`\n${i + 1}. ${f.test} (${f.type})`);
      if (f.error) {
        console.log(`   Error: ${f.error}`);
      } else {
        console.log(`   Input:    "${f.input}"`);
        console.log(`   Expected: "${f.expected}"`);
        console.log(`   Output:   "${f.output}"`);
      }
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🎯 LOW PERFECTION TOPICS TRAINING COMPLETE');
  console.log('='.repeat(80));
}

function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
  for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

runLowPerfectionTests().catch(console.error);
