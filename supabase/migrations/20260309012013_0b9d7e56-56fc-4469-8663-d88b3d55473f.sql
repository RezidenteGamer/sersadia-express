
-- Add new dedicated permissions to the enum
ALTER TYPE public.admin_permission ADD VALUE IF NOT EXISTS 'manage_banners';
ALTER TYPE public.admin_permission ADD VALUE IF NOT EXISTS 'manage_members';
ALTER TYPE public.admin_permission ADD VALUE IF NOT EXISTS 'view_financial_reports';
