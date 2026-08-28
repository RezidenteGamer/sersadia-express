-- "Sócio permanente" flag: admins/developers who should stay active
-- regardless of what the HR spreadsheet import says. Members with this
-- flag are skipped by the import's deactivate-if-missing step.
ALTER TABLE public.members
ADD COLUMN is_permanent boolean NOT NULL DEFAULT false;
