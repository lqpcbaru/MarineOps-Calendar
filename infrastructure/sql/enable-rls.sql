-- MarineOps Calendar — Enable Row Level Security (RLS) on application tables
--
-- MarineOps accesses the database exclusively through the NestJS API (Prisma),
-- which connects as the database owner role and therefore BYPASSES RLS.
-- PostgREST (Supabase's auto-generated REST API) is not used, so enabling RLS
-- WITHOUT any policy blocks PostgREST access while leaving Prisma untouched.
--
-- This resolves the Supabase lint warning:
--   "RLS Disabled in Public" for each public table.
--
-- Safe to run: enables RLS only; does not alter data, drop, or truncate.

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_token ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.station_provider_mappings ENABLE ROW LEVEL SECURITY;

-- Prisma's own migration tracking table (not an application model) is also
-- exposed in the public schema; enable RLS there too so the lint is clean.
ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
