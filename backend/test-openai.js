// Quick test script for OpenAI API key
require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testOpenAI() {
  console.log('🧪 Testing OpenAI API Key...\n');
  
  // Check if API key is loaded
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ ERROR: OPENAI_API_KEY not found in environment variables');
    console.log('💡 Make sure .env file exists in backend/ directory');
    process.exit(1);
  }
  
  console.log('✅ API Key loaded from .env file');
  console.log(`🔑 API Key: ${process.env.OPENAI_API_KEY.substring(0, 20)}...${process.env.OPENAI_API_KEY.slice(-4)}\n`);
  
  try {
    console.log('📡 Sending test request to OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Respond with exactly: "API key is working!"'
        },
        {
          role: 'user',
          content: 'Test message'
        }
      ],
      temperature: 0.3,
      max_tokens: 20
    });

    const result = response.choices[0].message.content;
    
    console.log('\n✅ SUCCESS! OpenAI API is working!');
    console.log(`📝 Response: "${result}"`);
    console.log(`🔢 Model used: ${response.model}`);
    console.log(`💰 Tokens used: ${response.usage.total_tokens}`);
    console.log('\n🎉 Your OpenAI integration is ready to use!\n');
    
  } catch (error) {
    console.error('\n❌ ERROR: OpenAI API call failed');
    console.error(`📛 Error Type: ${error.constructor.name}`);
    console.error(`💬 Error Message: ${error.message}`);
    
    if (error.status) {
      console.error(`🔢 Status Code: ${error.status}`);
    }
    
    if (error.status === 401) {
      console.error('\n💡 This usually means:');
      console.error('   - Invalid API key');
      console.error('   - API key has been revoked');
      console.error('   - API key doesn\'t have proper permissions');
    } else if (error.status === 429) {
      console.error('\n💡 Rate limit exceeded. Wait a moment and try again.');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Network error. Check your internet connection.');
    }
    
    console.error('\n');
    process.exit(1);
  }
}

// Run the test
testOpenAI();
