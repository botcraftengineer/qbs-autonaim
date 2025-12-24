-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Custom UUID v7 implementation without pg_uuidv7 extension
-- UUID v7 format: timestamp (48 bits) + version (4 bits) + random (12 bits) + variant (2 bits) + random (62 bits)
CREATE OR REPLACE FUNCTION uuid_generate_v7()
RETURNS uuid
AS $$
DECLARE
  unix_ts_ms bytea;
  uuid_bytes bytea;
BEGIN
  unix_ts_ms = substring(int8send(floor(extract(epoch from clock_timestamp()) * 1000)::bigint) from 3);
  
  uuid_bytes = unix_ts_ms || gen_random_bytes(10);
  
  uuid_bytes = set_byte(uuid_bytes, 6, (get_byte(uuid_bytes, 6) & 15) | 112);
  uuid_bytes = set_byte(uuid_bytes, 8, (get_byte(uuid_bytes, 8) & 63) | 128);

  RETURN encode(uuid_bytes, 'hex')::uuid;
END
$$
LANGUAGE plpgsql
VOLATILE;

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
