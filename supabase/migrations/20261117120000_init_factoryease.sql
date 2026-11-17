-- FactoryEase core schema (simple, factory-scoped)
-- Infra columns kept for RLS + offline: factory_id, client_id

create extension if not exists "pgcrypto";

create type public.user_role as enum ('owner', 'employee');
create type public.attendance_status as enum ('present', 'absent', 'half_day');
create type public.document_status as enum ('draft', 'final');

create table public.factories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  gstin text,
  phone text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role public.user_role not null,
  phone text,
  factory_id uuid references public.factories (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Roster (may exist without an app login; optional link to profiles)
create table public.employees (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references public.factories (id) on delete cascade,
  name text not null,
  phone text,
  is_active boolean not null default true,
  profile_id uuid unique references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  factory_id uuid not null references public.factories (id) on delete cascade,
  created_by uuid not null references public.profiles (id),
  amount numeric(12, 2) not null check (amount > 0),
  category text not null,
  description text,
  photo_url text,
  created_at timestamptz not null default now(),
  unique (factory_id, client_id)
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  factory_id uuid not null references public.factories (id) on delete cascade,
  employee_id uuid not null references public.employees (id) on delete cascade,
  date date not null,
  check_in timestamptz,
  check_out timestamptz,
  status public.attendance_status not null,
  marked_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (factory_id, client_id),
  unique (employee_id, date)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  factory_id uuid not null references public.factories (id) on delete cascade,
  name text not null,
  phone text,
  address text,
  gstin text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  factory_id uuid not null references public.factories (id) on delete cascade,
  customer_id uuid not null references public.customers (id),
  invoice_number text not null,
  invoice_date date not null default current_date,
  status public.document_status not null default 'draft',
  subtotal numeric(12, 2) not null default 0,
  tax numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  notes text,
  pdf_url text,
  created_at timestamptz not null default now(),
  unique (factory_id, client_id),
  unique (factory_id, invoice_number)
);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  description text not null,
  qty numeric(12, 2) not null check (qty > 0),
  rate numeric(12, 2) not null check (rate >= 0),
  amount numeric(12, 2) not null check (amount >= 0)
);

create table public.challans (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  factory_id uuid not null references public.factories (id) on delete cascade,
  customer_id uuid not null references public.customers (id),
  challan_number text not null,
  challan_date date not null default current_date,
  vehicle_no text,
  notes text,
  status public.document_status not null default 'draft',
  pdf_url text,
  created_at timestamptz not null default now(),
  unique (factory_id, client_id),
  unique (factory_id, challan_number)
);

create table public.challan_items (
  id uuid primary key default gen_random_uuid(),
  challan_id uuid not null references public.challans (id) on delete cascade,
  description text not null,
  qty numeric(12, 2) not null check (qty > 0),
  unit text
);

create index expenses_factory_created_idx on public.expenses (factory_id, created_at desc);
create index attendance_factory_date_idx on public.attendance (factory_id, date desc);
create index invoices_factory_date_idx on public.invoices (factory_id, invoice_date desc);
create index challans_factory_date_idx on public.challans (factory_id, challan_date desc);
create index employees_factory_active_idx on public.employees (factory_id, is_active);
create index customers_factory_name_idx on public.customers (factory_id, name);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger factories_set_updated_at before update on public.factories
for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create trigger employees_set_updated_at before update on public.employees
for each row execute function public.set_updated_at();

create trigger customers_set_updated_at before update on public.customers
for each row execute function public.set_updated_at();

create or replace function public.current_factory_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select factory_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

alter table public.factories enable row level security;
alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.expenses enable row level security;
alter table public.attendance enable row level security;
alter table public.customers enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.challans enable row level security;
alter table public.challan_items enable row level security;

create policy profiles_select_self_or_factory on public.profiles
for select using (
  id = auth.uid()
  or (
    public.current_role() = 'owner'
    and factory_id = public.current_factory_id()
  )
);

create policy profiles_update_self on public.profiles
for update using (id = auth.uid());

create policy factories_select_member on public.factories
for select using (id = public.current_factory_id());

create policy factories_update_owner on public.factories
for update using (
  id = public.current_factory_id()
  and public.current_role() = 'owner'
);

create policy factories_insert_authenticated on public.factories
for insert with check (created_by = auth.uid());

create policy employees_select_factory on public.employees
for select using (factory_id = public.current_factory_id());

create policy employees_write_owner on public.employees
for all using (
  factory_id = public.current_factory_id()
  and public.current_role() = 'owner'
)
with check (
  factory_id = public.current_factory_id()
  and public.current_role() = 'owner'
);

create policy expenses_select_owner on public.expenses
for select using (
  factory_id = public.current_factory_id()
  and public.current_role() = 'owner'
);

create policy expenses_write_owner on public.expenses
for all using (
  factory_id = public.current_factory_id()
  and public.current_role() = 'owner'
)
with check (
  factory_id = public.current_factory_id()
  and public.current_role() = 'owner'
);

create policy attendance_select_factory on public.attendance
for select using (
  factory_id = public.current_factory_id()
  and (
    public.current_role() = 'owner'
    or employee_id in (
      select id from public.employees where profile_id = auth.uid()
    )
  )
);

create policy attendance_write_owner on public.attendance
for all using (
  factory_id = public.current_factory_id()
  and public.current_role() = 'owner'
)
with check (
  factory_id = public.current_factory_id()
  and public.current_role() = 'owner'
);

create policy attendance_insert_self on public.attendance
for insert with check (
  factory_id = public.current_factory_id()
  and public.current_role() = 'employee'
  and employee_id in (
    select id from public.employees where profile_id = auth.uid()
  )
);

create policy attendance_update_self on public.attendance
for update using (
  factory_id = public.current_factory_id()
  and public.current_role() = 'employee'
  and employee_id in (
    select id from public.employees where profile_id = auth.uid()
  )
);

create policy customers_owner_all on public.customers
for all using (
  factory_id = public.current_factory_id()
  and public.current_role() = 'owner'
)
with check (
  factory_id = public.current_factory_id()
  and public.current_role() = 'owner'
);

create policy invoices_owner_all on public.invoices
for all using (
  factory_id = public.current_factory_id()
  and public.current_role() = 'owner'
)
with check (
  factory_id = public.current_factory_id()
  and public.current_role() = 'owner'
);

create policy invoice_items_owner_all on public.invoice_items
for all using (
  invoice_id in (
    select id from public.invoices where factory_id = public.current_factory_id()
  )
  and public.current_role() = 'owner'
)
with check (
  invoice_id in (
    select id from public.invoices where factory_id = public.current_factory_id()
  )
  and public.current_role() = 'owner'
);

create policy challans_owner_all on public.challans
for all using (
  factory_id = public.current_factory_id()
  and public.current_role() = 'owner'
)
with check (
  factory_id = public.current_factory_id()
  and public.current_role() = 'owner'
);

create policy challan_items_owner_all on public.challan_items
for all using (
  challan_id in (
    select id from public.challans where factory_id = public.current_factory_id()
  )
  and public.current_role() = 'owner'
)
with check (
  challan_id in (
    select id from public.challans where factory_id = public.current_factory_id()
  )
  and public.current_role() = 'owner'
);

insert into storage.buckets (id, name, public)
values
  ('bill-photos', 'bill-photos', false),
  ('documents', 'documents', false)
on conflict (id) do nothing;
