require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    console.log('🔍 Testing available Gemini models...\n');
    
    const modelsToTest = [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.0-pro',
      'gemini-2.0-flash-exp'
    ];
    
    for (const modelName of modelsToTest) {
      try {
        console.log(`Testing: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say hello');
        const response = await result.response;
        const text = response.text();
        console.log(`✅ ${modelName} - WORKS!`);
        console.log(`   Response: ${text.substring(0, 50)}...\n`);
      } catch (error) {
        console.log(`❌ ${modelName} - ${error.message}\n`);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listModels();
