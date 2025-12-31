const textProcessingService = require('./services/textProcessingService');

console.log('='.repeat(80));
console.log('MEDIUM-COMPLEXITY GRAMMAR TRAINING & TESTING');
console.log('Professional & Academic Communication Level');
console.log('='.repeat(80));

const trainingCases = [
  // SUBORDINATE CLAUSES - ALTHOUGH (Contrast)
  {
    category: 'Subordinate - Although',
    input: 'Although the project was challenging, the team successfully complete it on time',
    expected: 'completed (past tense consistency)'
  },
  {
    category: 'Subordinate - Although',
    input: 'The manager approve the proposal although she have some concerns about the budget',
    expected: 'approved + had (past tense sequence)'
  },
  {
    category: 'Subordinate - Although',
    input: 'Although we was working late, we finish all the documentation yesterday',
    expected: 'were working + finished'
  },

  // SUBORDINATE CLAUSES - BECAUSE (Cause/Effect)
  {
    category: 'Subordinate - Because',
    input: 'The meeting was postpone because several key stakeholders was unavailable',
    expected: 'postponed + were'
  },
  {
    category: 'Subordinate - Because',
    input: 'She decide to resign because she want to pursue a different career path',
    expected: 'decided + wanted'
  },
  {
    category: 'Subordinate - Because',
    input: 'Because the data was incomplete, the analysis team have to request additional information',
    expected: 'had to request (past tense sequence)'
  },

  // SUBORDINATE CLAUSES - WHILE (Simultaneous actions)
  {
    category: 'Subordinate - While',
    input: 'While the developers was coding, the designers prepare the UI mockups',
    expected: 'were coding + prepared or were preparing'
  },
  {
    category: 'Subordinate - While',
    input: 'The project manager monitor progress while the team was work on the implementation',
    expected: 'monitored + working'
  },
  {
    category: 'Subordinate - While',
    input: 'While I have been review the contract, I notice several inconsistencies',
    expected: 'was reviewing + noticed'
  },

  // SUBORDINATE CLAUSES - WHEN (Time relation)
  {
    category: 'Subordinate - When',
    input: 'When the client approve the design, we will began the development phase',
    expected: 'approves + begin (future form)'
  },
  {
    category: 'Subordinate - When',
    input: 'The team celebrate when they successfully deploy the application last week',
    expected: 'celebrated + deployed (past consistency)'
  },
  {
    category: 'Subordinate - When',
    input: 'When she arrive at the office tomorrow, the presentation will already prepared',
    expected: 'arrives + be prepared'
  },

  // SUBORDINATE CLAUSES - SINCE (Reason/Time)
  {
    category: 'Subordinate - Since',
    input: 'Since the policy was implemented, employee satisfaction have improve significantly',
    expected: 'has improved (present perfect)'
  },
  {
    category: 'Subordinate - Since',
    input: 'The company has been expanding rapidly since it launch its new product line last year',
    expected: 'launched (past tense after since)'
  },
  {
    category: 'Subordinate - Since',
    input: 'Since we was experiencing technical difficulties, the webinar was reschedule',
    expected: 'were + rescheduled'
  },

  // SUBORDINATE CLAUSES - IF (Condition)
  {
    category: 'Subordinate - If',
    input: 'If the budget approve by next week, we can started the project in January',
    expected: 'is approved + start'
  },
  {
    category: 'Subordinate - If',
    input: 'The deadline will extended if the team face unexpected challenges',
    expected: 'be extended + faces'
  },
  {
    category: 'Subordinate - If',
    input: 'If we had knew about the changes earlier, we would have adjust our timeline',
    expected: 'known + adjusted'
  },

  // RELATIVE CLAUSES - WHO
  {
    category: 'Relative - Who',
    input: 'The consultant who review our processes have provide valuable recommendations',
    expected: 'reviewed + has provided (or provided + provided)'
  },
  {
    category: 'Relative - Who',
    input: 'Employees who was trained on the new system adapt more quickly to the changes',
    expected: 'were + adapted'
  },
  {
    category: 'Relative - Who',
    input: 'The manager who had been oversee the project was promote to director last month',
    expected: 'overseeing + promoted'
  },

  // RELATIVE CLAUSES - WHICH
  {
    category: 'Relative - Which',
    input: 'The report which was submit yesterday contain several important findings',
    expected: 'submitted + contains'
  },
  {
    category: 'Relative - Which',
    input: 'We need to update the software which currently cause performance issues',
    expected: 'causes (present tense for ongoing state)'
  },
  {
    category: 'Relative - Which',
    input: 'The strategy which the board approve last quarter have been very effective',
    expected: 'approved + has been'
  },

  // RELATIVE CLAUSES - THAT
  {
    category: 'Relative - That',
    input: 'The policy that was introduce last year have significantly reduce operational costs',
    expected: 'introduced + has reduced'
  },
  {
    category: 'Relative - That',
    input: 'The challenges that we face during implementation was eventually overcome',
    expected: 'faced + were'
  },
  {
    category: 'Relative - That',
    input: 'The solution that the team propose has been accept by all stakeholders',
    expected: 'proposed + accepted'
  },

  // PURPOSE CLAUSES - TO/IN ORDER TO
  {
    category: 'Purpose - To',
    input: 'The committee meet yesterday to discussed the proposed changes',
    expected: 'met + discuss (infinitive after to)'
  },
  {
    category: 'Purpose - In Order To',
    input: 'We was implementing new procedures in order to improved efficiency',
    expected: 'were + improve (infinitive)'
  },
  {
    category: 'Purpose - To',
    input: 'The team work overtime last week to completed the project before the deadline',
    expected: 'worked + complete'
  },

  // PURPOSE CLAUSES - SO THAT
  {
    category: 'Purpose - So That',
    input: 'The manager provide clear instructions so that the team can completed their tasks efficiently',
    expected: 'provided + complete'
  },
  {
    category: 'Purpose - So That',
    input: 'We has implemented automated testing so that bugs was detected early',
    expected: 'have + are detected (or were detected)'
  },
  {
    category: 'Purpose - So That',
    input: 'The documentation was update so that new employees can easily understood the procedures',
    expected: 'updated + understand'
  },

  // COMPOUND-COMPLEX SENTENCES (Multiple clauses)
  {
    category: 'Compound-Complex',
    input: 'Although the deadline was tight, the developers who was assigned to the project complete all the features, and the testing team verify everything before launch',
    expected: 'were + completed + verified'
  },
  {
    category: 'Compound-Complex',
    input: 'When the company announce the merger last month, employees who have been with the firm for years express concerns, but management provide reassurances',
    expected: 'announced + had been + expressed + provided'
  },
  {
    category: 'Compound-Complex',
    input: 'Because the market conditions was changing rapidly, the strategy which was develop earlier need to be revise, so the planning team schedule additional meetings',
    expected: 'were + developed + needed + revised + scheduled'
  },
  {
    category: 'Compound-Complex',
    input: 'If the proposal that we submit next week get approve, we will began hiring new staff in order to expanding our operations',
    expected: 'is approved + begin + expand'
  },

  // TENSE SEQUENCING - Past Perfect + Simple Past
  {
    category: 'Tense Sequence - Past Perfect',
    input: 'By the time the client arrive, we already complete the presentation',
    expected: 'arrived + had already completed'
  },
  {
    category: 'Tense Sequence - Past Perfect',
    input: 'The team realize that they forget to include the financial projections',
    expected: 'realized + had forgotten'
  },
  {
    category: 'Tense Sequence - Past Perfect',
    input: 'After she review all the documents, she discover several errors that was overlook',
    expected: 'reviewed + discovered + had been overlooked'
  },

  // TENSE SEQUENCING - Future Perfect
  {
    category: 'Tense Sequence - Future Perfect',
    input: 'By next Friday, the team will completed all testing and will have deploy the application',
    expected: 'will have completed + deployed'
  },
  {
    category: 'Tense Sequence - Future Perfect',
    input: 'When the quarter end, we will have achieve all our targets',
    expected: 'ends + achieved'
  },

  // MIXED COMPLEXITY - Real-world scenarios
  {
    category: 'Real-world - Business',
    input: 'Although the quarterly results was below expectations, the CEO who join the company last year remain optimistic because several new initiatives is showing promise',
    expected: 'were + joined + remains + are showing'
  },
  {
    category: 'Real-world - Academic',
    input: 'The research team which has been study this phenomenon for five years publish findings that suggest traditional theories need to be revise',
    expected: 'studying + published + revised'
  },
  {
    category: 'Real-world - Technical',
    input: 'When the system was migrate to the cloud, the engineers who was responsible for the transition ensure that all data was properly backup',
    expected: 'migrated + were + ensured + backed up'
  },
  {
    category: 'Real-world - Project Management',
    input: 'Since the stakeholders approve the budget last month, the project manager have been hire additional resources in order to accelerated the timeline',
    expected: 'approved + has been hiring + accelerate'
  },

  // PASSIVE VOICE WITH COMPLEXITY
  {
    category: 'Passive - Complex',
    input: 'The proposal that was submit by the marketing team have been review and was approve by the board',
    expected: 'submitted + has been reviewed + approved'
  },
  {
    category: 'Passive - Complex',
    input: 'Although concerns was raise during the meeting, the decision which affect all departments were finalize',
    expected: 'were raised + affects + was finalized'
  }
];

async function runComplexityTest() {
  let totalTests = trainingCases.length;
  let corrections = 0;
  let noChange = 0;
  let errors = 0;
  let categoryStats = {};

  console.log(`\n📚 Training on ${totalTests} medium-complexity sentences...\n`);

  for (const test of trainingCases) {
    console.log('-'.repeat(80));
    console.log(`📖 Category: ${test.category}`);
    console.log(`Input:    "${test.input}"`);
    console.log(`Expected: ${test.expected}`);
    
    // Track category statistics
    if (!categoryStats[test.category]) {
      categoryStats[test.category] = { total: 0, corrected: 0, noChange: 0, errors: 0 };
    }
    categoryStats[test.category].total++;

    try {
      const result = await textProcessingService.improveEnglishText(test.input);
      console.log(`Output:   "${result}"`);
      
      if (result !== test.input) {
        console.log('✅ CORRECTED');
        corrections++;
        categoryStats[test.category].corrected++;
      } else {
        console.log('⚠️ NO CHANGE');
        noChange++;
        categoryStats[test.category].noChange++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      errors++;
      categoryStats[test.category].errors++;
    }
    
    // Small delay to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 MEDIUM-COMPLEXITY TRAINING RESULTS');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Corrections Applied: ${corrections} (${((corrections/totalTests)*100).toFixed(1)}%)`);
  console.log(`No Changes: ${noChange} (${((noChange/totalTests)*100).toFixed(1)}%)`);
  console.log(`Errors: ${errors} (${((errors/totalTests)*100).toFixed(1)}%)`);
  
  console.log('\n' + '='.repeat(80));
  console.log('📈 CATEGORY BREAKDOWN');
  console.log('='.repeat(80));
  
  Object.keys(categoryStats).sort().forEach(category => {
    const stats = categoryStats[category];
    const successRate = ((stats.corrected / stats.total) * 100).toFixed(0);
    console.log(`${category.padEnd(30)} | Tests: ${stats.total} | Corrected: ${stats.corrected} | Success: ${successRate}%`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('🎯 TRAINING COMPLETE');
  console.log('='.repeat(80));
}

runComplexityTest().catch(console.error);
