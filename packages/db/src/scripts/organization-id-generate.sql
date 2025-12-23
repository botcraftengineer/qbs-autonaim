-- Create organization_id_generate function with org_ prefix
-- Uses the same format as workspace_id_generate()
CREATE OR REPLACE FUNCTION organization_id_generate()
RETURNS text
AS $
BEGIN
  RETURN 'org_' || replace(uuid_generate_v7()::text, '-', '');
END
$
LANGUAGE plpgsql
VOLATILE;
