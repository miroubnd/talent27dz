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
