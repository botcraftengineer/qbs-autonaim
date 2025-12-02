-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE EXTENSION IF NOT EXISTS "pg_uuidv7";


-- Create workspace_id_generate function with ws_ prefix
CREATE OR REPLACE FUNCTION workspace_id_generate()
RETURNS text
AS $$
BEGIN
  RETURN 'ws_' || replace(uuid_generate_v7()::text, '-', '');
END
$$
LANGUAGE plpgsql
VOLATILE;
