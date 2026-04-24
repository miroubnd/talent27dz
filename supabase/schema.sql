-- 1. Profiles Table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('candidate', 'employer', 'admin')),
  full_name TEXT,
  company_name TEXT,
  registration_number TEXT,
  location TEXT,
  sector TEXT,
  contact_email TEXT,
  bio TEXT,
  avatar_url TEXT,
  cv_url TEXT,
  logo_url TEXT,
  specializations TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Platform Settings Table
CREATE TABLE public.platform_settings (
  id INT PRIMARY KEY DEFAULT 1,
  employer_registration_open BOOLEAN DEFAULT TRUE
);
-- Insert default row
INSERT INTO public.platform_settings (id, employer_registration_open) VALUES (1, TRUE);

-- 3. Jobs Table
CREATE TABLE public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  skills TEXT[],
  salary_range TEXT,
  location TEXT,
  job_type TEXT,
  sector TEXT,
  deadline DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Applications Table
CREATE TABLE public.applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  cover_letter TEXT,
  cv_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Notifications Table
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security) - Optional but recommended
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Optional: Create basic policies so that users can read data
-- Note: Make sure to restrict data based on your specific requirements later.
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Jobs viewable by everyone." ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Employers can insert jobs." ON public.jobs FOR INSERT WITH CHECK (auth.uid() = employer_id);
CREATE POLICY "Employers can update own jobs." ON public.jobs FOR UPDATE USING (auth.uid() = employer_id);
CREATE POLICY "Admins can update any job." ON public.jobs FOR UPDATE USING (
  EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Candidates view own applications" ON public.applications FOR SELECT USING (auth.uid() = candidate_id);
CREATE POLICY "Employers view applications for their jobs" ON public.applications FOR SELECT USING (
  EXISTS(SELECT 1 FROM jobs WHERE jobs.id = applications.job_id AND jobs.employer_id = auth.uid())
);
CREATE POLICY "Candidates can apply" ON public.applications FOR INSERT WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Users can see own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Everyone can read platform settings" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update platform settings" ON public.platform_settings FOR UPDATE USING (
  EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================
-- Required Enhancements (Dashboard/Profile)
-- ============================

-- Add fields used by current UI
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Keep updated_at fresh on profile edits
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Backfill profile emails from auth.users where possible
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.email = '');

-- Ensure applications status updates are allowed for employers of related jobs
DROP POLICY IF EXISTS "Employers update applications for own jobs" ON public.applications;
CREATE POLICY "Employers update applications for own jobs"
ON public.applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.jobs j
    WHERE j.id = applications.job_id
      AND j.employer_id = auth.uid()
  )
);

-- Helpful indexes for dashboard performance
CREATE INDEX IF NOT EXISTS idx_jobs_employer_id ON public.jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON public.applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- ============================
-- Storage Buckets & Policies
-- ============================

-- Buckets required by the app: avatars, cvs, logos
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('cv_uploads', 'cv_uploads', false),
  ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Avatars: users can upload/update/delete their own files under "<uid>-..."
DROP POLICY IF EXISTS "Avatar files readable by everyone" ON storage.objects;
CREATE POLICY "Avatar files readable by everyone"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users upload own avatars" ON storage.objects;
CREATE POLICY "Users upload own avatars"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users update own avatars" ON storage.objects;
CREATE POLICY "Users update own avatars"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.filename(name) LIKE auth.uid()::text || '-%')
);

DROP POLICY IF EXISTS "Users delete own avatars" ON storage.objects;
CREATE POLICY "Users delete own avatars"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.filename(name) LIKE auth.uid()::text || '-%')
);

-- Logos: employers can upload/update/delete their own files under "company-<uid>-..."
DROP POLICY IF EXISTS "Logos readable by everyone" ON storage.objects;
CREATE POLICY "Logos readable by everyone"
ON storage.objects
FOR SELECT
USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "Employers upload own logos" ON storage.objects;
CREATE POLICY "Employers upload own logos"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'logos');

DROP POLICY IF EXISTS "Employers update own logos" ON storage.objects;
CREATE POLICY "Employers update own logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'logos'
  AND auth.role() = 'authenticated'
  AND (
    storage.filename(name) LIKE 'company-' || auth.uid()::text || '-%'
    OR storage.filename(name) LIKE auth.uid()::text || '-%'
  )
);

DROP POLICY IF EXISTS "Employers delete own logos" ON storage.objects;
CREATE POLICY "Employers delete own logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'logos'
  AND auth.role() = 'authenticated'
  AND (
    storage.filename(name) LIKE 'company-' || auth.uid()::text || '-%'
    OR storage.filename(name) LIKE auth.uid()::text || '-%'
  )
);

-- CVs: private bucket, only owner (candidate) and related employers can read.
DROP POLICY IF EXISTS "Candidates upload own CVs" ON storage.objects;
CREATE POLICY "Candidates upload own CVs"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'cv_uploads');

DROP POLICY IF EXISTS "Candidates update own CVs" ON storage.objects;
CREATE POLICY "Candidates update own CVs"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'cv_uploads'
  AND auth.role() = 'authenticated'
  AND (storage.filename(name) LIKE auth.uid()::text || '-%')
);

DROP POLICY IF EXISTS "Candidates delete own CVs" ON storage.objects;
CREATE POLICY "Candidates delete own CVs"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'cv_uploads'
  AND auth.role() = 'authenticated'
  AND (storage.filename(name) LIKE auth.uid()::text || '-%')
);

DROP POLICY IF EXISTS "Candidate and related employers can read CVs" ON storage.objects;
CREATE POLICY "Candidate and related employers can read CVs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'cv_uploads'
  AND (
    -- Candidate owner path
    (auth.role() = 'authenticated' AND storage.filename(name) LIKE auth.uid()::text || '-%')
    OR
    -- Employers with applications linked to their jobs
    EXISTS (
      SELECT 1
      FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE j.employer_id = auth.uid()
        AND a.cv_url = storage.filename(name)
    )
  )
);
