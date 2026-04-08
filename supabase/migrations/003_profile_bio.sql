-- Add user bio/about text to profiles for account settings.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS bio TEXT;
