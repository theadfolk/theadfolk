const { google } = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly'
];

/**
 * Generate the OAuth URL for Gmail connection.
 * @param {string} userId - The Supabase user ID to use as state for the callback.
 * @returns {string} The auth URL.
 */
function getAuthUrl(userId) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Required to get a refresh token
    prompt: 'consent',
    scope: SCOPES,
    state: userId, // Pass the user ID so we know who this token belongs to
  });
}

/**
 * Exchange the auth code for tokens and return them.
 * @param {string} code - The auth code from Google callback.
 * @returns {object} The tokens object.
 */
async function getTokens(code) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

/**
 * Create an authenticated Gmail API client using a user's tokens.
 * @param {object} tokens - The tokens retrieved from the database.
 * @returns {object} The configured gmail client.
 */
function getGmailClient(tokens) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  client.setCredentials({
    access_token: tokens.google_access_token,
    refresh_token: tokens.google_refresh_token,
    expiry_date: tokens.google_token_expiry,
  });
  return google.gmail({ version: 'v1', auth: client });
}

/**
 * Extract plain text from a Gmail message payload.
 */
function extractTextFromPayload(payload) {
  let text = '';
  if (!payload) return text;
  
  if (payload.mimeType === 'text/plain' && payload.body && payload.body.data) {
    // Gmail uses url-safe base64
    text += Buffer.from(payload.body.data, 'base64').toString('utf8');
  } else if (payload.parts) {
    for (const part of payload.parts) {
      text += extractTextFromPayload(part);
    }
  }
  return text;
}

/**
 * Fetch threads from the last 90 days that match brand deal keywords.
 * @param {object} gmail - The authenticated Gmail client.
 * @returns {Array} List of extracted thread objects.
 */
async function fetchBrandDealThreads(gmail) {
  // Query: newer than 90 days + keywords
  const query = 'newer_than:90d AND (partnership OR collaboration OR sponsorship OR "brand deal" OR paid OR rate OR deliverables OR campaign)';
  
  try {
    const response = await gmail.users.threads.list({
      userId: 'me',
      q: query,
      maxResults: 50 // Limit for initial sync to avoid rate limits/timeouts
    });

    const threads = response.data.threads || [];
    const extractedThreads = [];

    for (const t of threads) {
      const threadData = await gmail.users.threads.get({
        userId: 'me',
        id: t.id,
      });

      // Extract text from all messages in the thread
      const messages = threadData.data.messages || [];
      let fullThreadText = '';
      let subject = '';
      let senderEmail = '';

      for (const msg of messages) {
        // Find subject and sender from headers
        if (msg.payload && msg.payload.headers) {
          if (!subject) {
            const subjectHeader = msg.payload.headers.find(h => h.name === 'Subject');
            if (subjectHeader) subject = subjectHeader.value;
          }
          if (!senderEmail) {
            const fromHeader = msg.payload.headers.find(h => h.name === 'From');
            if (fromHeader) {
              const match = fromHeader.value.match(/<(.+)>/);
              senderEmail = match ? match[1] : fromHeader.value;
            }
          }
        }
        
        const msgText = extractTextFromPayload(msg.payload);
        if (msgText) {
          fullThreadText += `\n--- Message ---\n${msgText}`;
        }
      }

      // If we couldn't extract text, use the snippet
      if (!fullThreadText.trim() && messages.length > 0) {
        fullThreadText = messages.map(m => m.snippet).join('\n');
      }

      extractedThreads.push({
        threadId: t.id,
        subject: subject,
        senderEmail: senderEmail,
        content: fullThreadText.trim()
      });
    }

    return extractedThreads;
  } catch (error) {
    console.error('Error fetching threads:', error);
    throw error;
  }
}

module.exports = {
  getAuthUrl,
  getTokens,
  getGmailClient,
  fetchBrandDealThreads,
};
