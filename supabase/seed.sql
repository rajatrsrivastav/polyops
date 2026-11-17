-- Manual bootstrap after creating users in Supabase Auth dashboard.
-- Replace the UUIDs with real auth.users ids.

-- 1) Create owner user in Authentication → Users (email + password)
-- 2) Run (as postgres / service role):

-- insert into public.factories (id, name, address, created_by)
-- values (
--   '11111111-1111-1111-1111-111111111111',
--   'Father Factory',
--   'Workshop Road',
--   'OWNER_AUTH_USER_UUID'
-- );

-- insert into public.profiles (id, full_name, role, phone, factory_id)
-- values (
--   'OWNER_AUTH_USER_UUID',
--   'Father',
--   'owner',
--   null,
--   '11111111-1111-1111-1111-111111111111'
-- );

-- 3) Create employee auth user, then:

-- insert into public.profiles (id, full_name, role, factory_id)
-- values (
--   'EMPLOYEE_AUTH_USER_UUID',
--   'Ramesh',
--   'employee',
--   '11111111-1111-1111-1111-111111111111'
-- );

-- insert into public.employees (factory_id, name, profile_id, is_active)
-- values (
--   '11111111-1111-1111-1111-111111111111',
--   'Ramesh',
--   'EMPLOYEE_AUTH_USER_UUID',
--   true
-- );
