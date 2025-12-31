const textProcessingService = require('./services/textProcessingService');

console.log('='.repeat(80));
console.log('RIGOROUS UNSEEN DATA TRAINING');
console.log('Fixing Critical Grammar Errors');
console.log('='.repeat(80));

const rigorousTests = [
  // USER'S EXACT EXAMPLE - Must fix completely
  {
    category: 'USER REPORTED ERROR',
    input: 'Although she was tired after the long meeting, but she stayed late for finish the report so the team can reviewed it this morning',
    expected: {
      fixes: [
        'Keep "tired" (adjective, not "tiring")',
        'Remove "but" (redundant with although)',
        'Change "for finish" to "to finish"',
        'Change "can reviewed" to "can review" or "could review"'
      ],
      correct: 'Although she was tired after the long meeting, she stayed late to finish the report so the team can review it this morning'
    }
  },
  
  // TENSE CONSISTENCY - Maintain tense across clauses
  {
    category: 'Tense Consistency',
    input: 'Because the deadline was approaching, they worked late in the office to finalize the proposal so the client could review it before the next meeting',
    expected: {
      fixes: ['Maintain past tense throughout (was approaching, worked, could)'],
      correct: 'Because the deadline was approaching, they worked late in the office to finalize the proposal so the client could review it before the next meeting'
    }
  },

  // SIMILAR PATTERNS - Adjective vs Gerund
  {
    category: 'Adjective Protection',
    input: 'The employees was tired after working overtime',
    expected: {
      fixes: ['were tired (not tiring)'],
      correct: 'were tired'
    }
  },
  {
    category: 'Adjective Protection',
    input: 'She is excited about the new project',
    expected: {
      fixes: ['Stay "excited" (not exciting)'],
      correct: 'is excited'
    }
  },
  {
    category: 'Adjective Protection',
    input: 'They was confused by the instructions',
    expected: {
      fixes: ['were confused (not confusing)'],
      correct: 'were confused'
    }
  },
  {
    category: 'Adjective Protection',
    input: 'He was interested in the proposal',
    expected: {
      fixes: ['Stay "interested" (not interesting)'],
      correct: 'was interested'
    }
  },

  // FOR + VERB → TO + VERB
  {
    category: 'Infinitive Purpose',
    input: 'The team meet for discussed the results',
    expected: {
      fixes: ['met + to discuss'],
      correct: 'to discuss'
    }
  },
  {
    category: 'Infinitive Purpose',
    input: 'We scheduled a meeting for reviewed the proposal',
    expected: {
      fixes: ['for reviewed → to review'],
      correct: 'to review'
    }
  },
  {
    category: 'Infinitive Purpose',
    input: 'She came early for completed the task',
    expected: {
      fixes: ['for completed → to complete'],
      correct: 'to complete'
    }
  },
  {
    category: 'Infinitive Purpose',
    input: 'The manager called for discussed the changes',
    expected: {
      fixes: ['for discussed → to discuss'],
      correct: 'to discuss'
    }
  },
  {
    category: 'Infinitive Purpose',
    input: 'They work hard for achieved their goals',
    expected: {
      fixes: ['for achieved → to achieve'],
      correct: 'to achieve'
    }
  },

  // MODAL + PAST PARTICIPLE → MODAL + BASE
  {
    category: 'Modal + Base Verb',
    input: 'The team can completed the project by Friday',
    expected: {
      fixes: ['can completed → can complete'],
      correct: 'can complete'
    }
  },
  {
    category: 'Modal + Base Verb',
    input: 'She will finished the report tomorrow',
    expected: {
      fixes: ['will finished → will finish'],
      correct: 'will finish'
    }
  },
  {
    category: 'Modal + Base Verb',
    input: 'We should reviewed the contract carefully',
    expected: {
      fixes: ['should reviewed → should review'],
      correct: 'should review'
    }
  },
  {
    category: 'Modal + Base Verb',
    input: 'They must completed all requirements',
    expected: {
      fixes: ['must completed → must complete'],
      correct: 'must complete'
    }
  },
  {
    category: 'Modal + Base Verb',
    input: 'You may submitted the form online',
    expected: {
      fixes: ['may submitted → may submit'],
      correct: 'may submit'
    }
  },
  {
    category: 'Modal + Base Verb',
    input: 'He could went to the conference',
    expected: {
      fixes: ['could went → could go'],
      correct: 'could go'
    }
  },
  {
    category: 'Modal + Base Verb',
    input: 'We might came back early',
    expected: {
      fixes: ['might came → might come'],
      correct: 'might come'
    }
  },

  // REDUNDANT CONJUNCTIONS
  {
    category: 'Redundant Conjunction',
    input: 'Although the deadline was tight, but we delivered on time',
    expected: {
      fixes: ['Remove "but"'],
      correct: 'Although the deadline was tight, we delivered on time'
    }
  },
  {
    category: 'Redundant Conjunction',
    input: 'Because it was raining, so we cancelled the event',
    expected: {
      fixes: ['Remove "so"'],
      correct: 'Because it was raining, we cancelled the event'
    }
  },
  {
    category: 'Redundant Conjunction',
    input: 'Though she was busy, but she helped us',
    expected: {
      fixes: ['Remove "but"'],
      correct: 'Though she was busy, she helped us'
    }
  },

  // COMPLEX COMBINATIONS
  {
    category: 'Multiple Errors',
    input: 'Because the system was complex, so the engineers must worked overtime for completed the migration',
    expected: {
      fixes: ['Remove "so"', 'must worked → must work', 'for completed → to complete'],
      correct: 'multiple fixes'
    }
  },
  {
    category: 'Multiple Errors',
    input: 'Although I was interested in the project, but I can not participated because I was busy',
    expected: {
      fixes: ['Remove "but"', 'can participated → can participate or cannot participate'],
      correct: 'multiple fixes'
    }
  },
  {
    category: 'Multiple Errors',
    input: 'The team was tired after the meeting, but they should completed the report for submitted it tomorrow',
    expected: {
      fixes: ['should completed → should complete', 'for submitted → to submit'],
      correct: 'multiple fixes'
    }
  },

  // PAST TENSE WITH TIME MARKERS
  {
    category: 'Past Tense Context',
    input: 'Yesterday the manager was frustrated because the deadline was missed',
    expected: {
      fixes: ['Keep "frustrated" (not frustrating)'],
      correct: 'was frustrated'
    }
  },
  {
    category: 'Past Tense Context',
    input: 'Last week the team was surprised by the results',
    expected: {
      fixes: ['Keep "surprised" (not surprising)'],
      correct: 'was surprised'
    }
  },

  // PRESENT PERFECT WITH ADJECTIVES
  {
    category: 'Perfect + Adjective',
    input: 'The employees have been satisfied with the changes',
    expected: {
      fixes: ['Keep "satisfied" (not satisfying)'],
      correct: 'have been satisfied'
    }
  },
  {
    category: 'Perfect + Adjective',
    input: 'She has been worried about the project timeline',
    expected: {
      fixes: ['Keep "worried" (not worrying)'],
      correct: 'has been worried'
    }
  },

  // PASSIVE VOICE WITH ADJECTIVES
  {
    category: 'Passive + Adjective',
    input: 'The proposal was approved by the board, and everyone was pleased',
    expected: {
      fixes: ['Keep "pleased" (not pleasing)'],
      correct: 'was pleased'
    }
  },

  // REAL-WORLD SENTENCES FROM MEETINGS
  {
    category: 'Real Meeting Notes',
    input: 'The stakeholders was concerned about the budget, but they must approved it for started the project',
    expected: {
      fixes: ['were concerned', 'must approved → must approve', 'for started → to start'],
      correct: 'multiple fixes'
    }
  },
  {
    category: 'Real Meeting Notes',
    input: 'Although the developers was tired after the sprint, but they can delivered the features on time',
    expected: {
      fixes: ['were tired', 'Remove "but"', 'can delivered → can deliver'],
      correct: 'multiple fixes'
    }
  },
  {
    category: 'Real Meeting Notes',
    input: 'Because the client was satisfied with the demo, so we will continued with the implementation',
    expected: {
      fixes: ['Keep "satisfied"', 'Remove "so"', 'will continued → will continue'],
      correct: 'multiple fixes'
    }
  }
];

async function runRigorousTest() {
  let totalTests = rigorousTests.length;
  let corrections = 0;
  let failures = [];
  let successes = [];

  console.log(`\n🔬 Running ${totalTests} rigorous tests on critical grammar patterns...\n`);

  for (const test of rigorousTests) {
    console.log('-'.repeat(80));
    console.log(`📋 Category: ${test.category}`);
    console.log(`Input:    "${test.input}"`);
    console.log(`Expected: ${test.expected.correct || test.expected.fixes.join(', ')}`);
    
    try {
      const result = await textProcessingService.improveEnglishText(test.input);
      console.log(`Output:   "${result}"`);
      
      // Check specific fixes
      let allFixed = true;
      const issues = [];
      
      // Specific validation based on category
      if (test.category === 'USER REPORTED ERROR') {
        if (result.includes('tiring')) {
          issues.push('❌ Still has "tiring" instead of "tired"');
          allFixed = false;
        }
        if (result.includes(', but ')) {
          issues.push('❌ Still has redundant "but"');
          allFixed = false;
        }
        if (result.includes('for finish')) {
          issues.push('❌ Still has "for finish" instead of "to finish"');
          allFixed = false;
        }
        if (result.includes('can reviewed') || result.includes('can review')) {
          if (result.includes('can reviewed')) {
            issues.push('❌ Still has "can reviewed"');
            allFixed = false;
          } else {
            issues.push('✅ Fixed "can reviewed" to "can review"');
          }
        }
      }
      
      // Check for common patterns
      if (test.category === 'Adjective Protection' && /tiring|exciting|confusing|interesting/.test(result)) {
        issues.push('❌ Adjective wrongly converted to gerund');
        allFixed = false;
      }
      
      if (test.category === 'Infinitive Purpose' && /for\s+(finish|complet|review|discuss|achiev)/.test(result)) {
        issues.push('❌ Still has "for + verb" instead of "to + verb"');
        allFixed = false;
      }
      
      if (test.category === 'Modal + Base Verb' && /(can|could|will|would|should|must|may|might)\s+\w+(ed|d)\b/.test(result)) {
        issues.push('❌ Still has modal + past participle');
        allFixed = false;
      }
      
      if (test.category === 'Redundant Conjunction' && /although.+but|because.+so|though.+but/i.test(result)) {
        issues.push('❌ Still has redundant conjunction');
        allFixed = false;
      }
      
      if (result !== test.input) {
        corrections++;
        
        if (allFixed && issues.every(i => i.startsWith('✅'))) {
          console.log('✅ PERFECTLY CORRECTED');
          successes.push({ test: test.category, input: test.input, output: result });
        } else {
          console.log('⚠️ PARTIALLY CORRECTED');
          issues.forEach(issue => console.log('  ' + issue));
          failures.push({ test: test.category, input: test.input, output: result, issues });
        }
      } else {
        console.log('❌ NO CHANGE - Grammar rules did not trigger');
        failures.push({ test: test.category, input: test.input, output: result, issues: ['No corrections applied'] });
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      failures.push({ test: test.category, input: test.input, error: error.message });
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 RIGOROUS TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Corrections Applied: ${corrections} (${((corrections/totalTests)*100).toFixed(1)}%)`);
  console.log(`Perfect Fixes: ${successes.length} (${((successes.length/totalTests)*100).toFixed(1)}%)`);
  console.log(`Partial/Failed: ${failures.length} (${((failures.length/totalTests)*100).toFixed(1)}%)`);

  if (failures.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('⚠️ FAILURES TO REVIEW');
    console.log('='.repeat(80));
    failures.forEach((fail, idx) => {
      console.log(`\n${idx + 1}. ${fail.test}`);
      console.log(`   Input:  "${fail.input}"`);
      console.log(`   Output: "${fail.output}"`);
      if (fail.issues) {
        fail.issues.forEach(issue => console.log(`   ${issue}`));
      }
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎯 RIGOROUS TRAINING COMPLETE');
  console.log('='.repeat(80));
}

runRigorousTest().catch(console.error);
