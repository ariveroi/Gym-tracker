-- All functions are SECURITY INVOKER: ownership policies also apply to RPC calls.
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_day_id text not null check (workout_day_id in ('day-1','day-2')),
  routine_version text not null,
  routine_snapshot jsonb not null check (jsonb_typeof(routine_snapshot) = 'object' and jsonb_typeof(routine_snapshot->'exercises') = 'array'),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'active' check (status in ('active','completed')),
  created_at timestamptz not null default now(),
  unique (id,user_id),
  check ((status = 'active' and completed_at is null) or (status = 'completed' and completed_at is not null and completed_at >= started_at))
);
create unique index one_active_session_per_user on public.workout_sessions(user_id) where status = 'active';
create index sessions_user_completed on public.workout_sessions(user_id,completed_at desc) where status = 'completed';
create table public.exercise_sets (
  id uuid primary key default gen_random_uuid(),
  workout_session_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null,
  set_number integer not null check (set_number between 1 and 30),
  weight_kg numeric(7,2) check (weight_kg between 0 and 1500),
  reps integer check (reps between 1 and 999),
  duration_seconds integer check (duration_seconds between 1 and 86400),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (workout_session_id,user_id) references public.workout_sessions(id,user_id) on delete cascade,
  unique (workout_session_id,exercise_id,set_number),
  check (duration_seconds is null or (weight_kg is null and reps is null)),
  check (completed_at is null or (duration_seconds is not null or (weight_kg is not null and reps is not null)))
);
create index sets_user_exercise on public.exercise_sets(user_id,exercise_id,completed_at desc);
alter table public.workout_sessions enable row level security;
alter table public.exercise_sets enable row level security;
revoke all on public.workout_sessions, public.exercise_sets from anon;
grant select,insert,update on public.workout_sessions to authenticated;
grant select,insert,update,delete on public.exercise_sets to authenticated;
create policy sessions_select on public.workout_sessions for select to authenticated using ((select auth.uid()) = user_id);
create policy sessions_insert on public.workout_sessions for insert to authenticated with check ((select auth.uid()) = user_id and status = 'active');
create policy sessions_update on public.workout_sessions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy sets_select on public.exercise_sets for select to authenticated using ((select auth.uid()) = user_id);
create policy sets_insert on public.exercise_sets for insert to authenticated with check ((select auth.uid()) = user_id);
create policy sets_update on public.exercise_sets for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy sets_delete on public.exercise_sets for delete to authenticated using ((select auth.uid()) = user_id);

create function public.guard_session_update() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if old.status = 'completed' or new.id <> old.id or new.user_id <> old.user_id
    or new.workout_day_id <> old.workout_day_id or new.routine_snapshot <> old.routine_snapshot
    or new.routine_version <> old.routine_version or new.started_at <> old.started_at or new.created_at <> old.created_at then
    raise exception 'Session is immutable';
  end if;
  if new.status = 'completed' then
    if not exists(select 1 from public.exercise_sets where workout_session_id = old.id and completed_at is not null) then
      raise exception 'Complete at least one set';
    end if;
    new.completed_at := clock_timestamp();
  end if;
  return new;
end; $$;
create trigger guard_session before update on public.workout_sessions for each row execute function public.guard_session_update();

create function public.guard_set_write() returns trigger language plpgsql security invoker set search_path = '' as $$
declare s public.workout_sessions; e jsonb; target_session uuid; target_exercise text;
begin
  if TG_OP = 'DELETE' then target_session := old.workout_session_id; target_exercise := old.exercise_id;
  else target_session := new.workout_session_id; target_exercise := new.exercise_id; end if;
  select * into s from public.workout_sessions where id = target_session for update;
  if s.id is null or s.status <> 'active' then raise exception 'No active session'; end if;
  select value into e from jsonb_array_elements(s.routine_snapshot->'exercises') where value->>'id' = target_exercise;
  if e is null then raise exception 'Exercise not in session'; end if;
  if TG_OP = 'DELETE' then
    if old.set_number <= (e->>'sets')::integer or old.set_number <> (select max(set_number) from public.exercise_sets where workout_session_id=target_session and exercise_id=target_exercise) then
      raise exception 'Only the last additional set can be removed';
    end if;
    return old;
  end if;
  if TG_OP = 'UPDATE' and (new.workout_session_id <> old.workout_session_id or new.user_id <> old.user_id or new.exercise_id <> old.exercise_id or new.set_number <> old.set_number or new.id <> old.id or new.created_at <> old.created_at) then
    raise exception 'Cannot reassign set';
  end if;
  if e->>'targetUnit' = 'seconds' and (new.weight_kg is not null or new.reps is not null) then raise exception 'Expected duration'; end if;
  if e->>'targetUnit' = 'reps' and new.duration_seconds is not null then raise exception 'Expected reps'; end if;
  if new.completed_at is not null then new.completed_at := clock_timestamp(); end if;
  return new;
end; $$;
create trigger guard_set before insert or update or delete on public.exercise_sets for each row execute function public.guard_set_write();

create function public.start_workout(p_day text,p_version text,p_snapshot jsonb) returns uuid language plpgsql security invoker set search_path = '' as $$
declare session_id uuid; last_day text; e jsonb;
begin
  if auth.uid() is null then raise exception 'Unauthorized'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
  select id into session_id from public.workout_sessions where user_id=auth.uid() and status='active';
  if session_id is not null then return session_id; end if;
  select workout_day_id into last_day from public.workout_sessions where user_id=auth.uid() and status='completed' order by completed_at desc limit 1;
  if p_day <> (case when last_day='day-1' then 'day-2' else 'day-1' end) then raise exception 'Sequence changed; retry'; end if;
  if p_snapshot->>'id' is distinct from p_day or jsonb_array_length(p_snapshot->'exercises') not between 1 and 20 then raise exception 'Invalid routine'; end if;
  insert into public.workout_sessions(user_id,workout_day_id,routine_version,routine_snapshot) values(auth.uid(),p_day,p_version,p_snapshot) returning id into session_id;
  for e in select value from jsonb_array_elements(p_snapshot->'exercises') loop
    if (e->>'sets')::integer not between 1 and 20 then raise exception 'Invalid set count'; end if;
    insert into public.exercise_sets(workout_session_id,user_id,exercise_id,set_number)
    select session_id,auth.uid(),e->>'id',generate_series(1,(e->>'sets')::integer);
  end loop;
  return session_id;
end; $$;
create function public.add_workout_set(p_session uuid,p_exercise text) returns uuid language plpgsql security invoker set search_path = '' as $$
declare result uuid; next_number integer;
begin
  perform 1 from public.workout_sessions where id=p_session and status='active' and user_id=auth.uid() for update;
  if not found then raise exception 'No active session'; end if;
  select coalesce(max(set_number),0)+1 into next_number from public.exercise_sets where workout_session_id=p_session and exercise_id=p_exercise;
  insert into public.exercise_sets(workout_session_id,user_id,exercise_id,set_number) values(p_session,auth.uid(),p_exercise,next_number) returning id into result;
  return result;
end; $$;
create function public.finish_workout(p_session uuid) returns uuid language plpgsql security invoker set search_path = '' as $$
declare s public.workout_sessions;
begin
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
  select * into s from public.workout_sessions where id=p_session and user_id=auth.uid() for update;
  if s.id is null then raise exception 'Not found'; end if;
  if s.status='completed' then return s.id; end if;
  update public.workout_sessions set status='completed',completed_at=clock_timestamp() where id=p_session;
  return p_session;
end; $$;
revoke execute on function public.start_workout(text,text,jsonb),public.finish_workout(uuid),public.add_workout_set(uuid,text),public.guard_session_update(),public.guard_set_write() from public,anon;
grant execute on function public.start_workout(text,text,jsonb),public.finish_workout(uuid),public.add_workout_set(uuid,text) to authenticated;
