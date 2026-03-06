
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('faculty', 'student');

-- Create user_roles table for RLS
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suffix VARCHAR(3) NOT NULL UNIQUE,
  reg_number VARCHAR(20) NOT NULL UNIQUE,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create attendance_records table
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  subject TEXT NOT NULL,
  section TEXT NOT NULL,
  period INTEGER NOT NULL CHECK (period >= 1 AND period <= 7),
  submitted_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (date, subject, section, period)
);
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Create attendance_entries table
CREATE TABLE public.attendance_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID REFERENCES public.attendance_records(id) ON DELETE CASCADE NOT NULL,
  student_suffix VARCHAR(3) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent'))
);
ALTER TABLE public.attendance_entries ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Anyone authenticated can view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for students
CREATE POLICY "Faculty can view all students" ON public.students
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'faculty'));
CREATE POLICY "Students can view own record" ON public.students
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for attendance_records
CREATE POLICY "Faculty can do everything on records" ON public.attendance_records
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'faculty'));
CREATE POLICY "Students can view records" ON public.attendance_records
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'student'));

-- RLS Policies for attendance_entries
CREATE POLICY "Faculty can do everything on entries" ON public.attendance_entries
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'faculty'));
CREATE POLICY "Students can view own entries" ON public.attendance_entries
  FOR SELECT TO authenticated USING (student_suffix = (
    SELECT suffix FROM public.students WHERE user_id = auth.uid() LIMIT 1
  ));

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
