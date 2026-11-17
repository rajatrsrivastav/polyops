-- Profiles auth helpers
-- profiles table itself is created in 20261117120000_init_factoryease.sql
--
-- public.profiles (
--   id uuid PK → auth.users.id
--   full_name text not null
--   role user_role not null  -- 'owner' | 'employee'
--   phone text
--   factory_id uuid → factories.id
--   created_at / updated_at
-- )

-- Owners may create employee profile rows after creating the Auth user in dashboard.
create policy profiles_insert_owner
on public.profiles
for insert
with check (
  public.current_role() = 'owner'
  and factory_id = public.current_factory_id()
  and role = 'employee'
);

-- First owner profile must be inserted with the service role / SQL editor
-- (see supabase/seed.sql) because RLS has no "bootstrap owner" path.
