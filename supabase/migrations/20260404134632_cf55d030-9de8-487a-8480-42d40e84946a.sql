
-- Add section column to students table
ALTER TABLE public.students ADD COLUMN section text NOT NULL DEFAULT 'MCA';

-- Update existing students to MCA
UPDATE public.students SET section = 'MCA' WHERE section = 'MCA';

-- Allow faculty to insert students
CREATE POLICY "Faculty can insert students"
ON public.students
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'faculty'::app_role));

-- Allow faculty to update students
CREATE POLICY "Faculty can update students"
ON public.students
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'faculty'::app_role));

-- Allow faculty to delete students
CREATE POLICY "Faculty can delete students"
ON public.students
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'faculty'::app_role));
