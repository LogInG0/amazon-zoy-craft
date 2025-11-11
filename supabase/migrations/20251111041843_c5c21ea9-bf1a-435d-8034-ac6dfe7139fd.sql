-- Create bans table for user moderation
CREATE TABLE public.bans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  banned_by UUID NOT NULL,
  reason TEXT NOT NULL,
  banned_until TIMESTAMP WITH TIME ZONE,
  is_permanent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bans ENABLE ROW LEVEL SECURITY;

-- Only admins can view bans
CREATE POLICY "Admins can view all bans"
ON public.bans
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Only admins can create bans
CREATE POLICY "Admins can create bans"
ON public.bans
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Only admins can update bans
CREATE POLICY "Admins can update bans"
ON public.bans
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Only admins can delete bans
CREATE POLICY "Admins can delete bans"
ON public.bans
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create function to check if user is banned
CREATE OR REPLACE FUNCTION public.is_user_banned(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bans
    WHERE user_id = _user_id
      AND (is_permanent = true OR (banned_until IS NOT NULL AND banned_until > now()))
  )
$$;