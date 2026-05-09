const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-20250514';

/**
 * Extract deal details from the email thread text.
 * @param {string} emailContent - The parsed email text.
 * @returns {object} Extracted JSON object with deal details.
 */
async function extractDealInfo(emailContent) {
  const systemPrompt = `You are an AI assistant helping a content creator analyze brand collaboration emails. 
Your task is to extract specific details from the email thread and output them as a structured JSON object. 
If a field is not mentioned in the email, set its value to null. 
Do not include any text outside the JSON object.

The JSON object must have exactly these keys:
- brandName: string or null
- pocName: string or null (Point of Contact name)
- pocEmail: string or null
- rate: string or null (Agreed rate or proposed budget)
- deliverables: array of strings or null (e.g., ["1x TikTok", "2x IG Story"])
- deadline: string or null
- campaignName: string or null
- status: one of ["Outreach", "Negotiating", "Confirmed", "Completed"]
- redFlags: array of strings or null (e.g., vague brief, no rate mentioned, exposure-only offer, urgency pressure, unprofessional language, requests for personal info)`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: `Extract the details from this email thread:\n\n${emailContent}` }
      ],
      temperature: 0,
    });

    const responseText = response.content[0].text;
    
    // Attempt to parse JSON even if Claude included some markdown formatting
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Error extracting deal info:', error);
    throw new Error('Deal extraction failed');
  }
}

/**
 * Screen the brand using Claude. Behavior changes based on tier.
 */
async function screenBrand(emailContent, creatorProfile, senderEmail, tier) {
  const isPersonalEmail = /@(gmail|yahoo|hotmail|outlook|icloud)\.com/i.test(senderEmail || '');
  
  if (tier === 'free') {
    // No screening for free tier
    return {
      isBusinessEmail: !isPersonalEmail,
      brandDescription: null,
      companySize: null,
      industry: null,
      socialPresence: null,
      legitimacyScore: null,
      synergyScore: null,
      recommendation: null,
      synergySummary: null
    };
  }

  if (tier === 'creator') {
    // Creator tier gets basic flags only (no web search, no deep analysis)
    // Red flags are already extracted in dealInfo.
    return {
      isBusinessEmail: !isPersonalEmail,
      brandDescription: 'Brand screening not available on Creator tier.',
      companySize: null,
      industry: null,
      socialPresence: null,
      legitimacyScore: null,
      synergyScore: null,
      recommendation: null,
      synergySummary: null
    };
  }

  // Pro tier gets full web search
  const systemPrompt = `You are a brand strategy analyst for content creators. 
Your job is to screen a brand that has reached out for a collaboration. 
You will use the provided web_search tool to research the brand if needed.
Then, evaluate the brand against the creator's profile for synergy.

Creator Profile (Niche/Audience):
${creatorProfile ? creatorProfile.niche_description : 'No profile provided.'}

Output your analysis strictly as a JSON object with no additional text. 
The JSON object must have exactly these keys:
- isBusinessEmail: boolean (true if business domain, false if personal like gmail/yahoo)
- brandDescription: string (1-2 sentences)
- companySize: one of ["Micro", "Small", "Mid-Market", "Enterprise"]
- industry: string
- socialPresence: one of ["Low", "Medium", "High"]
- legitimacyScore: integer (1-10)
- synergyScore: integer (1-10, based on how well the brand fits the creator's niche)
- recommendation: one of ["Strong Fit", "Decent Fit", "Weak Fit", "Hard Pass"]
- synergySummary: string (2-sentence explanation)`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      tools: [
        { type: 'web_search_20250305', name: 'web_search' }
      ],
      messages: [
        { role: 'user', content: `Please screen the brand from this email thread. Sender Email: ${senderEmail || 'Unknown'}\n\nEmail Thread:\n${emailContent}` }
      ],
      temperature: 0.2,
    });
    
    let finalContent = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        finalContent += block.text;
      }
    }

    const jsonMatch = finalContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return JSON.parse(finalContent);
  } catch (error) {
    console.error('Error screening brand:', error);
    throw new Error('Brand screening failed');
  }
}

/**
 * Process an email thread by running extraction and screening sequentially to avoid rate limits.
 */
async function processDealThread(emailContent, creatorProfile, senderEmail, tier = 'free') {
  // Truncate email content to ~10,000 characters to prevent huge token counts
  const maxChars = 20000;
  const safeContent = emailContent.length > maxChars 
    ? emailContent.substring(0, maxChars) + '\n...[TRUNCATED]' 
    : emailContent;

  // Run sequentially to stay under the 30k tokens per minute limit
  const dealInfo = await extractDealInfo(safeContent);
  const brandScreening = await screenBrand(safeContent, creatorProfile, senderEmail, tier);
  
  return {
    dealInfo,
    brandScreening
  };
}

module.exports = {
  extractDealInfo,
  screenBrand,
  processDealThread,
};
