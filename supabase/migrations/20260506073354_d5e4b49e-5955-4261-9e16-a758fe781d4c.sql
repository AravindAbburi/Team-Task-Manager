
-- Enums
create type public.app_role as enum ('admin', 'member');
create type public.task_status as enum ('todo', 'in_progress', 'done');
create type public.task_priority as enum ('low', 'medium', 'high');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles viewable by authenticated"
  on public.profiles for select to authenticated using (true);
create policy "Users update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);
create policy "Users insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

-- Roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users view own roles"
  on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "Admins view all roles"
  on public.user_roles for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles"
  on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Bootstrap: claim admin if no admin exists
create or replace function public.claim_admin_if_none()
returns boolean language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid();
begin
  if _uid is null then return false; end if;
  if exists (select 1 from public.user_roles where role = 'admin') then return false; end if;
  insert into public.user_roles (user_id, role) values (_uid, 'admin') on conflict do nothing;
  return true;
end; $$;

-- Auto-create profile + default member role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'member')
  on conflict do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.projects enable row level security;

-- Project members
create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  added_at timestamptz not null default now(),
  unique (project_id, user_id)
);
alter table public.project_members enable row level security;

create or replace function public.is_project_member(_project_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.project_members where project_id = _project_id and user_id = _user_id)
$$;

-- Project policies
create policy "Admins all projects"
  on public.projects for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "Members view their projects"
  on public.projects for select to authenticated
  using (public.is_project_member(id, auth.uid()));

-- Project member policies
create policy "Admins manage members"
  on public.project_members for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "Users view own membership"
  on public.project_members for select to authenticated
  using (user_id = auth.uid());
create policy "Members view co-members"
  on public.project_members for select to authenticated
  using (public.is_project_member(project_id, auth.uid()));

-- Tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status task_status not null default 'todo',
  priority task_priority not null default 'medium',
  assignee_id uuid references auth.users(id) on delete set null,
  due_date date,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tasks enable row level security;

create policy "Admins all tasks"
  on public.tasks for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "Members view tasks in their projects"
  on public.tasks for select to authenticated
  using (public.is_project_member(project_id, auth.uid()));
create policy "Assignees update their tasks"
  on public.tasks for update to authenticated
  using (assignee_id = auth.uid())
  with check (assignee_id = auth.uid());

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger tasks_touch before update on public.tasks
  for each row execute function public.touch_updated_at();
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

-- Indexes
create index on public.tasks (project_id);
create index on public.tasks (assignee_id);
create index on public.tasks (status);
create index on public.project_members (user_id);
