/**
 * Test grammar system on UNSEEN/UNTRAINED data
 * These are completely new sentences not in training
 */

const textProcessingService = require('./services/textProcessingService');

const unseenTestCases = [
  {
    input: "The engineers was coding the new feature last night",
    description: "Plural subject + was (unseen pattern)"
  },
  {
    input: "My manager are traveling to new york next month",
    description: "Singular + are + future time"
  },
  {
    input: "The clients wasn't satisfied with our proposal yesterday",
    description: "Plural + wasn't + past time"
  },
  {
    input: "He will walked to the store tomorrow morning",
    description: "will + past tense (new pattern)"
  },
  {
    input: "The developers has completed the testing last friday",
    description: "Plural + has + past time marker"
  },
  {
    input: "She are sending the email in two hours",
    description: "Singular + are + future expression"
  },
  {
    input: "The project manager don't have no time for this meeting",
    description: "Double negative (unseen combo)"
  },
  {
    input: "me and my colleagues was presenting the report last tuesday",
    description: "Pronoun order + tense + time"
  },
  {
    input: "The stakeholders is happy with the results we showed yesterday",
    description: "Plural + is + past context"
  },
  {
    input: "Our team will completed the deployment last week",
    description: "will + past participle + past time"
  },
  {
    input: "The designer has went to the client office this afternoon",
    description: "has went + time expression"
  },
  {
    input: "We was supposed to start the sprint planning at monday morning",
    description: "Plural + was + preposition errors"
  },
  {
    input: "Him and the other developer was working in the bug fixes",
    description: "Multiple errors: pronoun, tense, preposition"
  },
  {
    input: "The qa team are going to tests everything next week",
    description: "Multiple verb errors with future time"
  },
  {
    input: "My coworker has finish the documentation yesterday evening",
    description: "has + base form + past time"
  }
];

async function testUnseenData() {
  console.log('🔬 Testing Grammar System on COMPLETELY UNSEEN Data\n');
  console.log('='.repeat(80));
  console.log('These are NEW sentences never seen during development\n');
  
  let successCount = 0;
  
  for (const test of unseenTestCases) {
    console.log(`\n📝 ${test.description}`);
    console.log(`Input:  "${test.input}"`);
    
    try {
      const result = await textProcessingService.processMOMText(test.input);
      const output = result.final;
      
      console.log(`Output: "${output}"`);
      
      // Check if output is better than input
      const hasImprovement = output !== test.input;
      const hasBasicCorrections = 
        !output.match(/\b(was|were)\s+\w+\s+(yesterday|tomorrow)/i) &&  // No wrong tense
        !output.match(/\b(he|she)\s+were\b/i) &&  // No he/she were
        !output.match(/\b(they|we)\s+was\b/i) &&  // No they/we was
        !output.match(/\bdon't\s+\w+\s+no\b/i);   // No double negative
      
      if (hasImprovement && hasBasicCorrections) {
        console.log('✅ CORRECTED');
        successCount++;
      } else if (hasImprovement) {
        console.log('⚠️ PARTIALLY CORRECTED');
        successCount += 0.5;
      } else {
        console.log('❌ NO CHANGE');
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
    
    console.log('-'.repeat(80));
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`\n📊 Unseen Data Results:`);
  console.log(`   ✅ Successfully corrected: ${successCount}/${unseenTestCases.length}`);
  console.log(`   📈 Success Rate: ${((successCount/unseenTestCases.length) * 100).toFixed(1)}%`);
  console.log(`\n💡 System generalization ability: ${successCount >= unseenTestCases.length * 0.7 ? 'GOOD ✅' : 'NEEDS IMPROVEMENT ⚠️'}`);
  console.log(`\n${'='.repeat(80)}\n`);
}

testUnseenData().catch(console.error);
