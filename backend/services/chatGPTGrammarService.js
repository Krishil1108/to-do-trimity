const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Correct grammar using ChatGPT API
 * @param {string} text - The text to correct
 * @returns {Promise<string>} - The corrected text
 */
async function correctGrammarWithChatGPT(text) {
  try {
    if (!text || text.trim().length === 0) {
      return text;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert professional document editor specializing in Minutes of Meeting (MOM) documents. Your task is to:

1. Correct ALL grammar, spelling, and punctuation errors
2. Fix sentence structure and word order to sound natural and professional
3. Ensure proper tense usage (use past tense for completed discussions, future/present for plans)
4. Fix subject-verb agreement issues
5. Use proper articles (a, an, the), prepositions, and pronouns
6. Reframe awkward or improper sentences to sound professional and clear
7. Maintain the original meaning and key information
8. Make the text suitable for formal business documentation
9. Return ONLY the corrected and reframed text without any explanations or meta-commentary
10. Keep the text concise while preserving all important details

Examples:
Input: "The project which we discussed yesterday is approved and we will start it soon and the team is informed."
Output: "The project we discussed yesterday has been approved. We will start it soon, and the team has been informed."

Input: "Yesterday meeting was good all peoples come and discuss about new features"
Output: "Yesterday's meeting was productive. All team members attended and discussed the new features."`
        },
        {
          role: 'user',
          content: `Reframe and correct this text for a professional MOM document:\n\n${text}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const correctedText = response.choices[0].message.content.trim();
    return correctedText;
  } catch (error) {
    console.error('ChatGPT Grammar API Error:', error);
    
    // Fallback to original text if API fails
    return text;
  }
}

/**
 * Batch correct multiple texts
 * @param {string[]} texts - Array of texts to correct
 * @returns {Promise<string[]>} - Array of corrected texts
 */
async function batchCorrectGrammar(texts) {
  try {
    const corrections = await Promise.all(
      texts.map(text => correctGrammarWithChatGPT(text))
    );
    return corrections;
  } catch (error) {
    console.error('Batch correction error:', error);
    return texts; // Return originals if batch fails
  }
}

module.exports = {
  correctGrammarWithChatGPT,
  batchCorrectGrammar
};
