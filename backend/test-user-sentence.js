const axios = require('axios');

async function testUserSentence() {
  console.log('\n🧪 Testing User\'s Real-World Sentence\n');
  console.log('='.repeat(80));
  
  const input = "i want to go for shopping and eating chocolate for make my 31st night amazing";
  
  console.log(`\n📝 INPUT: ${input}`);
  
  try {
    const response = await axios.post('http://localhost:5000/api/tasks/grammar-check', {
      text: input
    });
    
    const output = response.data.correctedText;
    console.log(`\n✅ OUTPUT: ${output}`);
    
    // Check if issues are fixed
    const issues = [];
    
    if (output.includes('go for shopping')) {
      issues.push('❌ Still has "go for shopping" (should be "go shopping")');
    } else if (output.includes('go shopping')) {
      issues.push('✅ Fixed: "go shopping"');
    }
    
    if (output.match(/go.*and eating/i)) {
      issues.push('❌ Still has parallel structure issue: "go...and eating" (should be "go...and eat")');
    } else if (output.match(/go.*and eat/i)) {
      issues.push('✅ Fixed: Parallel structure "go...and eat"');
    }
    
    if (output.includes('for make')) {
      issues.push('❌ Still has "for make" (should be "to make")');
    } else if (output.includes('to make')) {
      issues.push('✅ Fixed: "to make"');
    }
    
    if (output.match(/^I\s/)) {
      issues.push('✅ Fixed: Capitalized "I"');
    }
    
    console.log('\n📊 Issue Analysis:');
    console.log('-'.repeat(80));
    issues.forEach(issue => console.log(issue));
    
    // Expected output
    const expected = "I want to go shopping and eat chocolate to make my 31st night amazing";
    console.log(`\n🎯 EXPECTED: ${expected}`);
    
    if (output.toLowerCase() === expected.toLowerCase()) {
      console.log('\n✅ PERFECT MATCH! All issues resolved.');
    } else {
      console.log('\n⚠️  Output differs from expected. Review issues above.');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.code) {
      console.error('Code:', error.code);
    }
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
}

testUserSentence();
