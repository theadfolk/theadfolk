# The Ad Folk - Backend REST API

This is the Node.js + Express backend for "The Ad Folk", a brand deal tracker designed for content creators. It seamlessly connects to a creator's Gmail account, automatically scans for brand deal outreach emails, extracts key details, and screens the brand for legitimacy and synergy using Anthropic's Claude 3.5 Sonnet AI. All data is securely synced to Supabase.

## Features

- **Gmail Integration:** OAuth2 flow to securely request and store offline access tokens.
- **Smart Email Scanner:** Fetches emails from the last 90 days filtered by collaboration keywords.
- **AI Deal Extraction:** Uses Claude API to pull structured JSON data from raw email text.
- **Parallel Brand Screening:** Automatically runs native web searches to evaluate brand legitimacy and synergy against the creator's saved profile.
- **Background Sync Engine:** A Node-Cron service that runs every 30 minutes to fetch new deals without duplicating existing ones.
- **Supabase Powered:** Secure PostgreSQL database with user-scoped data protection using Supabase Auth JWTs.

## Prerequisites

You will need the following tools and accounts:
- **Node.js** (v16+ recommended)
- **Supabase Account**: A new project with the provided SQL schema executed.
- **Google Cloud Console Account**: An application with the Gmail API enabled and OAuth 2.0 Credentials (Web application).
- **Anthropic Account**: An API key with access to Claude 3.5 Sonnet and the Web Search native tool.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   Open your Supabase Dashboard SQL Editor and run the SQL provided in `supabase/schema.sql`.

3. **Environment Variables**
   Create a `.env` file in the root directory (you can use `.env.example` as a template) and add your keys:
   ```env
   PORT=3000

   # Supabase Credentials
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Google OAuth Credentials
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

   # Claude API Credentials
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

4. **Start the Server**
   ```bash
   npm start
   # or for development:
   npm run dev
   ```

## API Endpoints

**All routes (except `/auth`) are protected and require a Supabase Auth JWT in the header:**
`Authorization: Bearer <YOUR_SUPABASE_JWT>`

- `GET /auth/google?userId=<UUID>` — Initiates the Gmail OAuth flow for a specific Supabase user.
- `GET /deals` — Fetches all deals and their associated brand screenings for the authenticated user.
- `GET /deals/:id` — Fetches details for a single deal.
- `PATCH /deals/:id` — Updates a deal's status (Body: `{ "status": "Negotiating" }`).
- `GET /profile` — Fetches the creator's niche and profile settings.
- `POST /profile` — Updates the creator's profile (Body: `{ "niche_description": "Tech and productivity" }`).
- `POST /sync` — Manually triggers the global background sync engine.

## Note on Rate Limits
The sync engine limits processing to 5 new email threads per sync run per user to respect the Anthropic API's 30,000 Tokens Per Minute limit. Remaining threads will be picked up seamlessly during the next 30-minute cron run.
