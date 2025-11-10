-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix search_path for notify_seller_on_review function
CREATE OR REPLACE FUNCTION public.notify_seller_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seller_id UUID;
  product_title TEXT;
BEGIN
  SELECT p.seller_id, p.title INTO seller_id, product_title
  FROM public.products p
  WHERE p.id = NEW.product_id;
  
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    seller_id,
    'new_review',
    'Новый отзыв на товар',
    'Оставлен новый отзыв на товар "' || product_title || '"'
  );
  
  RETURN NEW;
END;
$$;