-- ==============================================================================
-- APEX SOVEREIGN CLOUD: SUPABASE MASTER DATABASE SCHEMA
-- ==============================================================================
-- 100% Dual-Mirror Replica for:
--  1. CloseTesters Labs (Android 20-Tester OEM Engine & SLAs)
--  2. AstroMasterpiece (Sacred 10-Pillar Vedic Kundali & Akashic Intelligence)
-- ==============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- SUITE 1: CLOSETESTERS LABS (https://closetesters.com)
-- ==============================================================================

-- 1. Apps Registry
CREATE TABLE IF NOT EXISTS public.apps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_id TEXT UNIQUE,
    user_id TEXT NOT NULL,
    app_name TEXT NOT NULL,
    package_name TEXT,
    play_store_link TEXT,
    icon_url TEXT,
    category TEXT DEFAULT 'Tools',
    testers_needed INT DEFAULT 20,
    testers_active INT DEFAULT 0,
    days_completed INT DEFAULT 0,
    days_required INT DEFAULT 14,
    status TEXT DEFAULT 'ACTIVE', -- 'PENDING', 'ACTIVE', 'COMPLETED', 'PASSED'
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Hardware Testers Allocation
CREATE TABLE IF NOT EXISTS public.testers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_id TEXT UNIQUE,
    app_id UUID REFERENCES public.apps(id) ON DELETE CASCADE,
    tester_email TEXT NOT NULL,
    device_model TEXT NOT NULL,
    oem_brand TEXT,
    android_version TEXT,
    device_fingerprint TEXT,
    status TEXT DEFAULT 'OPTED_IN', -- 'INVITED', 'OPTED_IN', 'TESTING', 'COMPLETED'
    last_ping TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Daily Feedback & Bug Reports
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_id TEXT UNIQUE,
    app_id UUID REFERENCES public.apps(id) ON DELETE CASCADE,
    tester_email TEXT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT NOT NULL,
    screenshot_url TEXT,
    crash_reported BOOLEAN DEFAULT FALSE,
    device_info JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Google Play Production Proofs
CREATE TABLE IF NOT EXISTS public.proofs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_id TEXT UNIQUE,
    app_id UUID REFERENCES public.apps(id) ON DELETE CASCADE,
    proof_type TEXT DEFAULT 'OPT_IN', -- 'OPT_IN', 'ACTIVE_DAILY', 'PRODUCTION_TRACK'
    image_url TEXT NOT NULL,
    verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SLA Guarantees & Production Agreements
CREATE TABLE IF NOT EXISTS public.sla_agreements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_id TEXT UNIQUE,
    user_id TEXT NOT NULL,
    app_name TEXT NOT NULL,
    package_type TEXT DEFAULT 'Sovereign Quad-Stack Bundle',
    amount NUMERIC DEFAULT 299.00,
    currency TEXT DEFAULT 'USD',
    guarantee_days INT DEFAULT 14,
    status TEXT DEFAULT 'IN_PROGRESS',
    agreement_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Inbound QA & Audit Inquiries
CREATE TABLE IF NOT EXISTS public.dev_qa_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    email TEXT NOT NULL,
    app_name TEXT,
    target_url TEXT,
    message TEXT,
    source TEXT DEFAULT 'Web Inbound',
    status TEXT DEFAULT 'NEW',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SUITE 2: ASTRO MASTERPIECE (https://astromasterpiece.com)
-- ==============================================================================

-- 1. Client Profiles & Birth Dossiers
CREATE TABLE IF NOT EXISTS public.astro_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid TEXT UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    gender TEXT,
    dob DATE NOT NULL,
    tob TIME NOT NULL,
    pob TEXT NOT NULL,
    latitude NUMERIC(10, 6),
    longitude NUMERIC(10, 6),
    timezone NUMERIC(4, 2) DEFAULT 5.5,
    ayanamsa TEXT DEFAULT 'Lahiri',
    profile_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Multi-Device Sessions
CREATE TABLE IF NOT EXISTS public.device_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    device_id TEXT NOT NULL,
    device_name TEXT,
    platform TEXT,
    ip_address TEXT,
    token TEXT,
    last_active TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 10-Pillar Kundali Intelligence & Akashic Records
CREATE TABLE IF NOT EXISTS public.kundali_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_id TEXT UNIQUE,
    user_id TEXT NOT NULL,
    report_title TEXT DEFAULT '10-Pillar Akashic Kundali Analysis',
    lagna_chart JSONB NOT NULL,
    navamsha_chart JSONB,
    planetary_strengths JSONB, -- Shadbala & Ashtakvarga
    dosha_analysis JSONB,       -- Mangal, Kaal Sarp, Shani Sade Sati
    vedic_remedies JSONB,      -- Gemstones, Rudraksha, Mantras, Yantras
    gemini_ai_dossier JSONB,   -- Deep synthesis from Gemini API
    pdf_report_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. WhatsApp Confidential Consultations
CREATE TABLE IF NOT EXISTS public.consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_id TEXT UNIQUE,
    client_name TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    problem_category TEXT, -- 'Career', 'Finance', 'Marriage', 'Health', 'Sade Sati'
    scheduled_slot TIMESTAMPTZ,
    status TEXT DEFAULT 'REQUESTED', -- 'REQUESTED', 'CONFIRMED', 'COMPLETED'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Dynamic Cloud Config (Key Rotation & Feature Flags)
CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) & ACCESS POLICIES
-- ==============================================================================

-- Enable RLS
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_qa_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.astro_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kundali_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Anonymous and Authenticated Public Policies
CREATE POLICY "Public Read for Apps" ON public.apps FOR SELECT USING (true);
CREATE POLICY "Public Insert for Apps" ON public.apps FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update for Apps" ON public.apps FOR UPDATE USING (true);

CREATE POLICY "Public Read for Testers" ON public.testers FOR SELECT USING (true);
CREATE POLICY "Public Insert for Testers" ON public.testers FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read for Feedback" ON public.feedback FOR SELECT USING (true);
CREATE POLICY "Public Insert for Feedback" ON public.feedback FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read for Proofs" ON public.proofs FOR SELECT USING (true);
CREATE POLICY "Public Insert for Proofs" ON public.proofs FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read for SLAs" ON public.sla_agreements FOR SELECT USING (true);
CREATE POLICY "Public Insert for SLAs" ON public.sla_agreements FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Insert for QA Requests" ON public.dev_qa_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read for QA Requests" ON public.dev_qa_requests FOR SELECT USING (true);

CREATE POLICY "Public Read for Astro Users" ON public.astro_users FOR SELECT USING (true);
CREATE POLICY "Public Insert for Astro Users" ON public.astro_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update for Astro Users" ON public.astro_users FOR UPDATE USING (true);

CREATE POLICY "Public Read for Device Sessions" ON public.device_sessions FOR SELECT USING (true);
CREATE POLICY "Public Insert for Device Sessions" ON public.device_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update for Device Sessions" ON public.device_sessions FOR UPDATE USING (true);

CREATE POLICY "Public Read for Kundali Reports" ON public.kundali_reports FOR SELECT USING (true);
CREATE POLICY "Public Insert for Kundali Reports" ON public.kundali_reports FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Insert for Consultations" ON public.consultations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read for Consultations" ON public.consultations FOR SELECT USING (true);

CREATE POLICY "Public Read for App Config" ON public.app_config FOR SELECT USING (true);

-- Indexes for Lightning-Fast Queries
CREATE INDEX IF NOT EXISTS idx_apps_user ON public.apps(user_id);
CREATE INDEX IF NOT EXISTS idx_apps_status ON public.apps(status);
CREATE INDEX IF NOT EXISTS idx_testers_app ON public.testers(app_id);
CREATE INDEX IF NOT EXISTS idx_feedback_app ON public.feedback(app_id);
CREATE INDEX IF NOT EXISTS idx_astro_firebase_uid ON public.astro_users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_astro_phone ON public.astro_users(phone);
CREATE INDEX IF NOT EXISTS idx_kundali_user ON public.kundali_reports(user_id);
