
CREATE TABLE public.marks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_suffix VARCHAR NOT NULL,
  section TEXT NOT NULL DEFAULT 'MCA',
  subject TEXT NOT NULL,
  mid1 NUMERIC(4,1) CHECK (mid1 >= 0 AND mid1 <= 20),
  mid2 NUMERIC(4,1) CHECK (mid2 >= 0 AND mid2 <= 20),
  internal NUMERIC(4,1) GENERATED ALWAYS AS (
    CASE
      WHEN mid1 IS NOT NULL AND mid2 IS NOT NULL THEN (mid1 + mid2) / 2
      WHEN mid1 IS NOT NULL THEN mid1
      WHEN mid2 IS NOT NULL THEN mid2
      ELSE NULL
    END
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (student_suffix, section, subject)
);

ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Faculty can do everything on marks"
ON public.marks FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'faculty'::app_role));

CREATE POLICY "Students can view own marks"
ON public.marks FOR SELECT
TO authenticated
USING (
  student_suffix::text = (
    SELECT s.suffix::text FROM public.students s WHERE s.user_id = auth.uid() LIMIT 1
  )
);
