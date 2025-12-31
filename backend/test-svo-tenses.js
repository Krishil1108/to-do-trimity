const textProcessingService = require('./services/textProcessingService');

console.log('='.repeat(80));
console.log('COMPREHENSIVE SVO & 12 TENSES TEST');
console.log('='.repeat(80));

const testCases = [
  // SVO STRUCTURE TESTS
  {
    category: 'SVO Structure',
    input: 'Went John to the store yesterday',
    expected: 'Subject before verb: John went to the store yesterday'
  },
  {
    category: 'SVO Structure',
    input: 'The meeting attended by all team members',
    expected: 'Complete SVO: All team members attended the meeting'
  },
  
  // 1. SIMPLE PRESENT
  {
    category: '1. Simple Present',
    input: 'He go to office every day',
    expected: 'He goes to office every day'
  },
  {
    category: '1. Simple Present',
    input: 'She study hard for exams',
    expected: 'She studies hard for exams'
  },
  {
    category: '1. Simple Present',
    input: 'It work perfectly fine',
    expected: 'It works perfectly fine'
  },
  
  // 2. SIMPLE PAST
  {
    category: '2. Simple Past',
    input: 'I see him yesterday',
    expected: 'I saw him yesterday'
  },
  {
    category: '2. Simple Past',
    input: 'They go to the party last night',
    expected: 'They went to the party last night'
  },
  
  // 3. SIMPLE FUTURE
  {
    category: '3. Simple Future',
    input: 'I will went to the conference tomorrow',
    expected: 'I will go to the conference tomorrow'
  },
  {
    category: '3. Simple Future',
    input: 'She will completed the task soon',
    expected: 'She will complete the task soon'
  },
  {
    category: '3. Simple Future',
    input: 'We will did our best next time',
    expected: 'We will do our best next time'
  },
  
  // 4. PRESENT CONTINUOUS
  {
    category: '4. Present Continuous',
    input: 'I am work on the project now',
    expected: 'I am working on the project now'
  },
  {
    category: '4. Present Continuous',
    input: 'She is prepare the presentation currently',
    expected: 'She is preparing the presentation currently'
  },
  
  // 5. PAST CONTINUOUS
  {
    category: '5. Past Continuous',
    input: 'They was working on it yesterday',
    expected: 'They were working on it yesterday'
  },
  {
    category: '5. Past Continuous',
    input: 'He were coding when I called',
    expected: 'He was coding when I called'
  },
  
  // 6. FUTURE CONTINUOUS
  {
    category: '6. Future Continuous',
    input: 'I will working on this tomorrow',
    expected: 'I will be working on this tomorrow'
  },
  {
    category: '6. Future Continuous',
    input: 'They will traveling next week',
    expected: 'They will be traveling next week'
  },
  
  // 7. PRESENT PERFECT
  {
    category: '7. Present Perfect',
    input: 'I have finish the work already',
    expected: 'I have finished the work already'
  },
  {
    category: '7. Present Perfect',
    input: 'She has go to the meeting just now',
    expected: 'She has gone to the meeting just now'
  },
  {
    category: '7. Present Perfect',
    input: 'We have see this before',
    expected: 'We have seen this before'
  },
  
  // 8. PAST PERFECT
  {
    category: '8. Past Perfect',
    input: 'He had finish before I arrived',
    expected: 'He had finished before I arrived'
  },
  {
    category: '8. Past Perfect',
    input: 'They had go home when we reached',
    expected: 'They had gone home when we reached'
  },
  
  // 9. FUTURE PERFECT
  {
    category: '9. Future Perfect',
    input: 'I will have complete it by tomorrow',
    expected: 'I will have completed it by tomorrow'
  },
  {
    category: '9. Future Perfect',
    input: 'She will have finish by then',
    expected: 'She will have finished by then'
  },
  
  // 10. PRESENT PERFECT CONTINUOUS
  {
    category: '10. Present Perfect Continuous',
    input: 'I have been work here for 5 years',
    expected: 'I have been working here for 5 years'
  },
  {
    category: '10. Present Perfect Continuous',
    input: 'She has been study since morning',
    expected: 'She has been studying since morning'
  },
  
  // 11. PAST PERFECT CONTINUOUS
  {
    category: '11. Past Perfect Continuous',
    input: 'He had been wait for hours before she came',
    expected: 'He had been waiting for hours before she came'
  },
  {
    category: '11. Past Perfect Continuous',
    input: 'They had been work on it for months',
    expected: 'They had been working on it for months'
  },
  
  // 12. FUTURE PERFECT CONTINUOUS
  {
    category: '12. Future Perfect Continuous',
    input: 'I will have been work here for 10 years by next month',
    expected: 'I will have been working here for 10 years by next month'
  },
  {
    category: '12. Future Perfect Continuous',
    input: 'She will have been live in this city for a decade',
    expected: 'She will have been living in this city for a decade'
  },
  
  // COMPLEX MIXED CASES
  {
    category: 'Mixed - Tense + Agreement',
    input: 'The developers was working on the project last week and has completed it yesterday',
    expected: 'were working (past continuous + plural) + completed (simple past with yesterday)'
  },
  {
    category: 'Mixed - Multiple Errors',
    input: 'She have went to office yesterday and will came back tomorrow',
    expected: 'She had gone/went + will come (no past tense after will)'
  }
];

async function runTests() {
  let passCount = 0;
  let failCount = 0;
  
  for (const test of testCases) {
    console.log('\n' + '-'.repeat(80));
    console.log(`Category: ${test.category}`);
    console.log(`Input:    "${test.input}"`);
    console.log(`Expected: ${test.expected}`);
    
    try {
      const result = await textProcessingService.improveEnglishText(test.input);
      console.log(`Output:   "${result}"`);
      
      // Check if output is different from input (correction applied)
      if (result !== test.input) {
        console.log('✅ CORRECTED - Changes applied');
        passCount++;
      } else {
        console.log('⚠️ NO CHANGE - Check if input was already correct or rule needs enhancement');
        failCount++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      failCount++;
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${testCases.length}`);
  console.log(`Corrections Applied: ${passCount}`);
  console.log(`No Changes: ${failCount}`);
  console.log(`Success Rate: ${((passCount / testCases.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(80));
}

runTests().catch(console.error);
