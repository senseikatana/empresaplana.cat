ALTER TABLE public."User" ADD COLUMN IF NOT EXISTS "insforgeId" uuid;
CREATE UNIQUE INDEX IF NOT EXISTS "User_insforgeId_key" ON public."User" ("insforgeId");
ALTER TABLE public."User" DROP COLUMN IF EXISTS "totpSecret";
ALTER TABLE public."User" DROP COLUMN IF EXISTS "passkey";

DROP TABLE IF EXISTS public.auth_invitations;
DROP TABLE IF EXISTS public.auth_members;
DROP TABLE IF EXISTS public.auth_organizations;
DROP TABLE IF EXISTS public.auth_accounts;
DROP TABLE IF EXISTS public.auth_sessions;
DROP TABLE IF EXISTS public.auth_passkeys;
DROP TABLE IF EXISTS public.auth_two_factors;
DROP TABLE IF EXISTS public.auth_verifications;
DROP TABLE IF EXISTS public.auth_users;