-- The Ad Folk - Supabase Schema

-- Enable pgcrypto for UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table
-- Contains user identity and secure storage for Google OAuth tokens
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  google_access_token TEXT,
  google_refresh_token TEXT,
  google_token_expiry BIGINT,
  subscription_tier TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Creator Profiles Table
-- Stores the creator's saved profile to compute synergy scores
CREATE TABLE public.creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  niche_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Deals Table
-- Extracted deal information from email threads
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  thread_id TEXT NOT NULL,
  brand_name TEXT,
  poc_name TEXT,
  poc_email TEXT,
  rate TEXT,
  deliverables JSONB,
  deadline TEXT,
  campaign_name TEXT,
  status TEXT DEFAULT 'Outreach',
  red_flags JSONB,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate entries per thread per user
  UNIQUE(user_id, thread_id)
);

-- 4. Brand Screenings Table
-- Parallel brand screening data
CREATE TABLE public.brand_screenings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  sender_domain TEXT,
  is_business_email BOOLEAN,
  brand_description TEXT,
  company_size TEXT,
  industry TEXT,
  social_presence TEXT,
  legimacy_score INTEGER,
  synergy_score INTEGER,
  recommendation TEXT,
  synergy_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
-- To ensure multi-user architecture from day one

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_screenings ENABLE ROW LEVEL SECURITY;

-- Note: Since this is an external Node.js backend accessing Supabase via the Service Role Key (or standard Anon key with custom JWT), 
-- you may want to manage access control directly in the backend. 
-- However, if the frontend accesses these tables directly, you should define appropriate RLS policies here.
