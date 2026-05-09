const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function run() {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: 'Test',
      tools: [
        { type: 'web_search_20250305', name: 'web_search' }
      ],
      messages: [
        { role: 'user', content: 'Search for something' }
      ],
    });
    console.log('Success:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error details:', error);
  }
}

run();
