/**
 * Enhanced Grammar Testing Suite
 * Tests the rigorous context-aware grammar system
 */

const textProcessingService = require('./services/textProcessingService');

const enhancedTests = [
  {
    input: "She were preparing the presentation yesterday",
    expected: "was preparing",
    description: "Past tense with yesterday"
  },
  {
    input: "They was discussing budget yesterday",
    expected: "were discussing",
    description: "Plural past tense"
  },
  {
    input: "He is going to office yesterday",
    expected: "was going",
    description: "Present to past with time marker"
  },
  {
    input: "We was going to meet tomorrow",
    expected: "will",
    description: "Past to future with tomorrow"
  },
  {
    input: "She went tomorrow to the office",
    expected: "will go",
    description: "Past verb with future time"
  },
  {
    input: "todays meetin was abot the new project me and john was discussing the budjet",
    expected: "Today's meeting was about",
    description: "Complex real-world MOM"
  },
  {
    input: "The team are meeting in monday at morning",
    expected: "on Monday in the morning",
    description: "Prepositions with time"
  },
  {
    input: "He has went to the bank yesterday",
    expected: "went to the bank" ,
    description: "Irregular verb with past time"
  },
  {
    input: "me and sarah has went to client office last week",
    expected: "Sarah and I went",
    description: "Pronouns with irregular verb"
  },
  {
    input: "The goverment will handel the commitee meeting tommorow",
    expected: "government will handle the committee meeting tomorrow",
    description: "Multiple spelling errors"
  }
];

async function runEnhancedTests() {
  console.log('🚀 Enhanced Grammar Testing Suite\n');
  console.log('='.repeat(80));
  
  let passed = 0;
  let failed = 0;
  
  for (const test of enhancedTests) {
    console.log(`\n📝 ${test.description}`);
    console.log(`Input:    "${test.input}"`);
    
    try {
      const result = await textProcessingService.processMOMText(test.input);
      const output = result.final;
      
      console.log(`Output:   "${output}"`);
      console.log(`Expected: "${test.expected}"`);
      
      const success = output.toLowerCase().includes(test.expected.toLowerCase());
      
      if (success) {
        console.log('✅ PASSED');
        passed++;
      } else {
        console.log('❌ FAILED');
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      failed++;
    }
    
    console.log('-'.repeat(80));
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`\n📊 Final Results:`);
  console.log(`   ✅ Passed: ${passed}/${enhancedTests.length}`);
  console.log(`   ❌ Failed: ${failed}/${enhancedTests.length}`);
  console.log(`   📈 Success Rate: ${((passed/enhancedTests.length) * 100).toFixed(1)}%`);
  console.log(`\n${'='.repeat(80)}\n`);
}

runEnhancedTests().catch(console.error);
