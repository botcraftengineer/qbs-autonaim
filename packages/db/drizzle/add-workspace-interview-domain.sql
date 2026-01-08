-- Add interview_domain column to workspaces table
-- This allows each workspace to have a custom domain for interview links
-- If not set, the system will use NEXT_PUBLIC_INTERVIEW_URL from environment

ALTER TABLE workspaces 
ADD COLUMN interview_domain TEXT;

COMMENT ON COLUMN workspaces.interview_domain IS 'Custom domain for interview links (e.g., https://interview.company.com). If null, uses NEXT_PUBLIC_INTERVIEW_URL';
