-- Fix security issues

-- 1. Fix profiles table - restrict to authenticated users only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 2. Fix reviews table - only show reviews for active products
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;

CREATE POLICY "Users can view reviews for active products"
ON public.reviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = reviews.product_id
    AND products.is_active = true
  )
);

-- 3. Allow system to create notifications via trigger (already exists)
-- Add policy for system inserts
CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);