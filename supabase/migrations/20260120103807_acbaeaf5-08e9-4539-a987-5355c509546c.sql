-- Add mbrf_id field to profiles table for employee identification
ALTER TABLE public.profiles 
ADD COLUMN mbrf_id text UNIQUE;

-- Add mbrf_id field to members table for linking members by ID
ALTER TABLE public.members 
ADD COLUMN mbrf_id text UNIQUE;

-- Create index for faster lookup
CREATE INDEX idx_members_mbrf_id ON public.members(mbrf_id) WHERE mbrf_id IS NOT NULL;