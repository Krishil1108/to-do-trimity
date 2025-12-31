const axios = require('axios');

async function testGrammar() {
  try {
    const text = 'this is what i was doing tomorrow';
    
    const response = await axios.post('https://api.languagetoolplus.com/v2/check', null, {
      params: {
        text: text,
        language: 'en-US'
      }
    });
    
    console.log('Original text:', text);
    console.log('\nIssues found:', response.data.matches.length);
    console.log('\nDetails:');
    
    response.data.matches.forEach((m, i) => {
      console.log(`\n${i + 1}. ${m.message}`);
      console.log(`   Problem: "${text.substring(m.offset, m.offset + m.length)}"`);
      console.log(`   Suggestions: ${m.replacements.slice(0, 3).map(r => r.value).join(', ')}`);
      console.log(`   Rule: ${m.rule.id}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testGrammar();
