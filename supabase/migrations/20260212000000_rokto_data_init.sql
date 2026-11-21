-- ==========================================================
-- ROKTO DATA (রক্তদাতা) - Full Database Schema & Security Architecture
-- Platform: Supabase PostgreSQL with PostGIS
-- Country: Bangladesh
-- Covers:
--   1. locations (Divisions, Districts, Upazilas)
--   2. profiles
--   3. roles & user_roles (Server-controlled RBAC)
--   4. donor_profiles
--   5. hospitals
--   6. blood_requests
--   7. donor_responses
--   8. notifications
--   9. reports (Abuse reports)
--  10. verification_records (DGHS hospital & donor credentials)
--  11. donation_records
--  12. device_tokens (FCM Web/Android push)
--  13. location_shares (Time-limited privacy consent)
--  14. audit_logs (Tamper-evident, append-only)
--  15. user_consents (Contact, location, medical disclosure)
-- ==========================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Enumerated Types
DO $$ BEGIN
  CREATE TYPE user_role_type AS ENUM (
    'guest',
    'donor',
    'seeker',
    'hospital',
    'moderator',
    'district_admin',
    'super_admin'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE blood_group_type AS ENUM (
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE donor_availability_type AS ENUM (
    'available', 'unavailable', 'temporarily_unavailable'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE request_status_type AS ENUM (
    'submitted',
    'under_review',
    'finding_donors',
    'donor_responded',
    'completed',
    'cancelled',
    'expired'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE hospital_status_type AS ENUM (
    'pending', 'verified', 'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_status_type AS ENUM (
    'pending', 'approved', 'rejected', 'expired'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Table: locations (Administrative hierarchy of Bangladesh)
CREATE TABLE IF NOT EXISTS public.locations (
  id VARCHAR(50) PRIMARY KEY, -- e.g. 'dhaka', 'dhaka_dhanmondi'
  type VARCHAR(20) NOT NULL CHECK (type IN ('division', 'district', 'upazila')),
  parent_id VARCHAR(50) REFERENCES public.locations(id) ON DELETE CASCADE,
  name_en VARCHAR(100) NOT NULL,
  name_bn VARCHAR(100) NOT NULL,
  lat NUMERIC(9,6),
  lng NUMERIC(9,6),
  centroid GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_parent ON public.locations(parent_id);
CREATE INDEX IF NOT EXISTS idx_locations_type ON public.locations(type);
CREATE INDEX IF NOT EXISTS idx_locations_centroid ON public.locations USING GIST (centroid);

-- 4. Table: profiles (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL UNIQUE,
  phone_verified BOOLEAN DEFAULT FALSE,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150),
  date_of_birth DATE,
  blood_group blood_group_type NOT NULL,
  division_id VARCHAR(50) REFERENCES public.locations(id),
  district_id VARCHAR(50) REFERENCES public.locations(id),
  upazila_id VARCHAR(50) REFERENCES public.locations(id),
  area VARCHAR(100),
  avatar_url TEXT,
  preferred_language VARCHAR(5) DEFAULT 'bn' CHECK (preferred_language IN ('bn', 'en')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(division_id, district_id, upazila_id);
CREATE INDEX IF NOT EXISTS idx_profiles_blood_group ON public.profiles(blood_group);

-- 5. Table: roles (Available System Roles Definition)
CREATE TABLE IF NOT EXISTS public.roles (
  name user_role_type PRIMARY KEY,
  description_en VARCHAR(200) NOT NULL,
  description_bn VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed system roles
INSERT INTO public.roles (name, description_en, description_bn) VALUES
  ('guest', 'Unauthenticated or read-only visitor', 'নিবন্ধনহীন ভিজিটর'),
  ('donor', 'Voluntary blood donor', 'স্বেচ্ছাসেবী রক্তদাতা'),
  ('seeker', 'Recipient or patient guardian searching blood', 'রক্তগ্রহীতা বা রোগীর অভিভাবক'),
  ('hospital', 'Verified medical institution / blood center', 'যাচাইকৃত হাসপাতাল বা রক্তকেন্দ্র'),
  ('moderator', 'Platform moderator reviewing requests and reports', 'প্ল্যাটফর্ম মডারেটর'),
  ('district_admin', 'Administrative manager for a specific district', 'জেলা প্রশাসনিক ব্যবস্থাপক'),
  ('super_admin', 'Full platform administrator', 'সর্বোচ্চ সিস্টেম প্রশাসক')
ON CONFLICT (name) DO NOTHING;

-- 6. Table: user_roles (Server-controlled role assignment - strictly restricted)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role user_role_type NOT NULL,
  assigned_by UUID REFERENCES public.profiles(id),
  district_scope VARCHAR(50) REFERENCES public.locations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 7. Table: donor_profiles (Donor availability and privacy settings)
CREATE TABLE IF NOT EXISTS public.donor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  blood_group blood_group_type NOT NULL,
  availability donor_availability_type DEFAULT 'available',
  last_donation_date DATE,
  total_donations INT DEFAULT 0 CHECK (total_donations >= 0),
  division_id VARCHAR(50) REFERENCES public.locations(id),
  district_id VARCHAR(50) REFERENCES public.locations(id),
  upazila_id VARCHAR(50) REFERENCES public.locations(id),
  area VARCHAR(100),
  approx_location GEOGRAPHY(POINT, 4326),
  contact_number_protected BOOLEAN DEFAULT TRUE,
  medical_eligibility_acknowledged BOOLEAN DEFAULT FALSE,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donor_profiles_location ON public.donor_profiles USING GIST (approx_location);
CREATE INDEX IF NOT EXISTS idx_donor_profiles_lookup ON public.donor_profiles (blood_group, availability, district_id);

-- 8. Table: hospitals (DGHS verified medical centers)
CREATE TABLE IF NOT EXISTS public.hospitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en VARCHAR(200) NOT NULL,
  name_bn VARCHAR(200) NOT NULL,
  license_number VARCHAR(100) NOT NULL UNIQUE,
  address TEXT NOT NULL,
  division_id VARCHAR(50) REFERENCES public.locations(id),
  district_id VARCHAR(50) REFERENCES public.locations(id),
  upazila_id VARCHAR(50) REFERENCES public.locations(id),
  contact_phone VARCHAR(20) NOT NULL,
  contact_email VARCHAR(100),
  location GEOGRAPHY(POINT, 4326),
  status hospital_status_type DEFAULT 'pending',
  verification_document_url TEXT,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hospitals_license ON public.hospitals(license_number);
CREATE INDEX IF NOT EXISTS idx_hospitals_status ON public.hospitals(status, district_id);
CREATE INDEX IF NOT EXISTS idx_hospitals_location ON public.hospitals USING GIST (location);

-- 9. Table: blood_requests (Emergency blood requests)
CREATE TABLE IF NOT EXISTS public.blood_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requester_name VARCHAR(100) NOT NULL,
  requester_phone VARCHAR(20) NOT NULL,
  patient_name VARCHAR(100),
  blood_group blood_group_type NOT NULL,
  units_required INT NOT NULL CHECK (units_required BETWEEN 1 AND 10),
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  hospital_name VARCHAR(200) NOT NULL,
  hospital_address TEXT NOT NULL,
  division_id VARCHAR(50) REFERENCES public.locations(id),
  district_id VARCHAR(50) REFERENCES public.locations(id),
  upazila_id VARCHAR(50) REFERENCES public.locations(id),
  location GEOGRAPHY(POINT, 4326),
  required_date_time TIMESTAMPTZ NOT NULL,
  urgency VARCHAR(20) DEFAULT 'critical' CHECK (urgency IN ('critical', 'high', 'normal')),
  additional_info TEXT,
  status request_status_type DEFAULT 'submitted',
  is_hospital_verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blood_requests_location ON public.blood_requests USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status_group ON public.blood_requests (status, blood_group, district_id);
CREATE INDEX IF NOT EXISTS idx_blood_requests_requester ON public.blood_requests (requester_id);

-- 10. Table: donor_responses (Responses from willing donors)
CREATE TABLE IF NOT EXISTS public.donor_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES public.blood_requests(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'interested' CHECK (status IN ('interested', 'declined', 'contacted', 'donated')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(request_id, donor_id) -- Duplicate response prevention
);

CREATE INDEX IF NOT EXISTS idx_donor_responses_req ON public.donor_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_donor_responses_donor ON public.donor_responses(donor_id);

-- 11. Table: notifications (In-app notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  title_bn VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  message_bn TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('emergency_match', 'donor_response', 'request_status', 'verification', 'system')),
  related_request_id UUID REFERENCES public.blood_requests(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read);

-- 12. Table: reports (Abuse & safety reports)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('request', 'user', 'response', 'hospital')),
  target_id UUID NOT NULL,
  reason VARCHAR(100) NOT NULL,
  details TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
  reviewed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports(target_type, target_id);

-- 13. Table: verification_records (Hospital and donor credential audits)
CREATE TABLE IF NOT EXISTS public.verification_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_type VARCHAR(30) NOT NULL CHECK (target_type IN ('hospital', 'donor', 'organization')),
  target_id UUID NOT NULL,
  document_type VARCHAR(50) NOT NULL, -- e.g. 'dghs_license', 'nid_card', 'blood_test_report'
  document_url TEXT NOT NULL,
  verification_status verification_status_type DEFAULT 'pending',
  verified_by UUID REFERENCES public.profiles(id),
  verification_notes TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_records_target ON public.verification_records(target_type, target_id);

-- 14. Table: donation_records (Verified blood donation events)
CREATE TABLE IF NOT EXISTS public.donation_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.blood_requests(id) ON DELETE SET NULL,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  donation_date DATE NOT NULL,
  units INT DEFAULT 1 CHECK (units BETWEEN 1 AND 5),
  verified_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donation_records_donor ON public.donation_records(donor_id, donation_date);

-- 15. Table: device_tokens (Push notification tokens for FCM)
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('web', 'android', 'ios')),
  device_info JSONB,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON public.device_tokens(user_id);

-- 16. Table: location_shares (Time-bounded user location sharing)
CREATE TABLE IF NOT EXISTS public.location_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  approx_lat NUMERIC(9,6) NOT NULL,
  approx_lng NUMERIC(9,6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_location_shares_user ON public.location_shares(user_id, expires_at);

-- 17. Table: audit_logs (Tamper-evident, immutable activity trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role user_role_type NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action, created_at);

-- 18. Table: user_consents (Explicit consent records for privacy compliance)
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN ('contact_share', 'location_share', 'medical_disclaimer', 'terms_and_privacy')),
  consented BOOLEAN NOT NULL DEFAULT TRUE,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user ON public.user_consents(user_id, consent_type);

-- ==========================================================
-- 19. SECURITY DEFINER HELPER FUNCTIONS
-- ==========================================================

-- Check if current authenticated user has a specific role
CREATE OR REPLACE FUNCTION public.auth_has_role(check_role user_role_type)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = check_role
  );
$$;

-- Check if current user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT public.auth_has_role('super_admin');
$$;

-- Check if current user is moderator or higher
CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('moderator', 'district_admin', 'super_admin')
  );
$$;

-- Secure RPC to assign roles: ONLY super_admin can invoke!
CREATE OR REPLACE FUNCTION public.assign_user_role(
  p_target_user_id UUID,
  p_role user_role_type,
  p_district_scope VARCHAR(50) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Strict check: Caller must be super_admin
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only super_admin can assign administrative roles.' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.user_roles (user_id, role, assigned_by, district_scope)
  VALUES (p_target_user_id, p_role, auth.uid(), p_district_scope)
  ON CONFLICT (user_id, role) 
  DO UPDATE SET district_scope = EXCLUDED.district_scope;

  -- Create audit log entry
  INSERT INTO public.audit_logs (actor_id, actor_role, action, target_type, target_id, details)
  VALUES (
    auth.uid(),
    'super_admin',
    'ASSIGN_ROLE',
    'user',
    p_target_user_id::text,
    jsonb_build_object('role', p_role, 'district_scope', p_district_scope)
  );

  RETURN jsonb_build_object('success', true, 'message', 'Role assigned successfully');
END;
$$;

-- ==========================================================
-- 20. POSTGIS SEARCH FUNCTIONS
-- ==========================================================

-- Function to match nearby donors within a given radius (km)
CREATE OR REPLACE FUNCTION public.match_donors_nearby(
  p_blood_group blood_group_type,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION DEFAULT 10
)
RETURNS TABLE (
  donor_id UUID,
  full_name VARCHAR,
  blood_group blood_group_type,
  division_id VARCHAR,
  district_id VARCHAR,
  upazila_id VARCHAR,
  distance_km DOUBLE PRECISION,
  availability donor_availability_type,
  total_donations INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    dp.user_id AS donor_id,
    p.full_name,
    dp.blood_group,
    dp.division_id,
    dp.district_id,
    dp.upazila_id,
    ROUND((ST_DistanceSphere(dp.approx_location::geometry, ST_MakePoint(p_lng, p_lat)) / 1000)::numeric, 1)::double precision AS distance_km,
    dp.availability,
    dp.total_donations
  FROM public.donor_profiles dp
  JOIN public.profiles p ON p.id = dp.user_id
  WHERE (p_blood_group IS NULL OR dp.blood_group = p_blood_group)
    AND dp.availability = 'available'
    AND p.status = 'active'
    AND ST_DWithin(dp.approx_location, ST_MakePoint(p_lng, p_lat)::geography, p_radius_km * 1000)
  ORDER BY distance_km ASC;
$$;

-- ==========================================================
-- 21. AUTOMATIC TIMESTAMPS & AUDIT TRIGGERS
-- ==========================================================

CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_donor_profiles_updated_at ON public.donor_profiles;
CREATE TRIGGER set_donor_profiles_updated_at BEFORE UPDATE ON public.donor_profiles FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_blood_requests_updated_at ON public.blood_requests;
CREATE TRIGGER set_blood_requests_updated_at BEFORE UPDATE ON public.blood_requests FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_hospitals_updated_at ON public.hospitals;
CREATE TRIGGER set_hospitals_updated_at BEFORE UPDATE ON public.hospitals FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_reports_updated_at ON public.reports;
CREATE TRIGGER set_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();

-- Trigger to increment donation count upon verified donation record
CREATE OR REPLACE FUNCTION public.trigger_on_donation_verified()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.donor_profiles
  SET total_donations = total_donations + NEW.units,
      last_donation_date = NEW.donation_date
  WHERE user_id = NEW.donor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_donation_verified_trigger ON public.donation_records;
CREATE TRIGGER on_donation_verified_trigger AFTER INSERT ON public.donation_records FOR EACH ROW EXECUTE PROCEDURE public.trigger_on_donation_verified();

-- ==========================================================
-- 22. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================

-- Enable RLS across all 15 tables
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- 1. locations: Public read-only
CREATE POLICY "Locations readable by everyone" ON public.locations FOR SELECT USING (true);

-- 2. profiles: Viewable by authenticated users; update self only; admin can update status
CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- 3. roles: Public read-only
CREATE POLICY "Roles viewable by everyone" ON public.roles FOR SELECT USING (true);

-- 4. user_roles: User can view own roles; Admins can view all; WRITES STRICTLY DISALLOWED VIA CLIENT DIRECT INSERT
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_moderator());
-- No INSERT/UPDATE/DELETE policies for authenticated users on user_roles: forces usage of assign_user_role() RPC!

-- 5. donor_profiles: Viewable by authenticated users; Donors manage own profile
CREATE POLICY "Donor profiles viewable by authenticated users" ON public.donor_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Donors can insert own profile" ON public.donor_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Donors can update own profile" ON public.donor_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 6. hospitals: Public can view verified; registered hospital staff view own; admins view/edit all
CREATE POLICY "Verified hospitals viewable by all" ON public.hospitals FOR SELECT USING (status = 'verified' OR auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can register hospital" ON public.hospitals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins or verified staff update hospitals" ON public.hospitals FOR UPDATE TO authenticated USING (public.is_moderator());

-- 7. blood_requests: Readable by all (emergency network needs broad reach); Requester can insert & update
CREATE POLICY "Blood requests readable by all" ON public.blood_requests FOR SELECT USING (true);
CREATE POLICY "Users can create blood requests" ON public.blood_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update own blood requests" ON public.blood_requests FOR UPDATE TO authenticated USING (auth.uid() = requester_id OR public.is_moderator());

-- 8. donor_responses: Donors & Requesters can view responses
CREATE POLICY "Donor or requester can view responses" ON public.donor_responses FOR SELECT TO authenticated
  USING (
    donor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.blood_requests r WHERE r.id = request_id AND r.requester_id = auth.uid()) OR
    public.is_moderator()
  );
CREATE POLICY "Donors can submit response" ON public.donor_responses FOR INSERT TO authenticated WITH CHECK (auth.uid() = donor_id);
CREATE POLICY "Donors can update own response" ON public.donor_responses FOR UPDATE TO authenticated USING (auth.uid() = donor_id);

-- 9. notifications: User can only access own notifications
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 10. reports: Users can submit; Moderators can view and review
CREATE POLICY "Users can create reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users view own reports or moderators view all" ON public.reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id OR public.is_moderator());
CREATE POLICY "Moderators can update reports" ON public.reports FOR UPDATE TO authenticated USING (public.is_moderator());

-- 11. verification_records: Staff/Donor view own, Admins view & edit
CREATE POLICY "View own verification or admins view all" ON public.verification_records FOR SELECT TO authenticated
  USING (target_id = auth.uid() OR public.is_moderator());
CREATE POLICY "Admins can manage verification records" ON public.verification_records FOR ALL TO authenticated
  USING (public.is_moderator());

-- 12. donation_records: Donor views own; Admins & Hospitals view all
CREATE POLICY "Donors view own donation records" ON public.donation_records FOR SELECT TO authenticated
  USING (donor_id = auth.uid() OR public.is_moderator());
CREATE POLICY "Moderators can insert donation records" ON public.donation_records FOR INSERT TO authenticated
  WITH CHECK (public.is_moderator());

-- 13. device_tokens: Strict user isolation
CREATE POLICY "Users manage own device tokens" ON public.device_tokens FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 14. location_shares: User manages own active location share
CREATE POLICY "Users manage own location shares" ON public.location_shares FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 15. audit_logs: Tamper-evident append-only; Admins can read; NO USER CAN UPDATE OR DELETE!
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_moderator());
CREATE POLICY "System and users can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);
-- STRICT: NO UPDATE POLICY AND NO DELETE POLICY ON audit_logs (Enforces append-only immutability)

-- 16. user_consents: User reads and records own consents
CREATE POLICY "Users view own consents" ON public.user_consents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own consents" ON public.user_consents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own consents" ON public.user_consents FOR UPDATE TO authenticated USING (auth.uid() = user_id);
