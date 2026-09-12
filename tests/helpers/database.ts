import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
export const USER_A = 'aab21860-bf43-4bd7-b8bb-ef7c031fb433';
export const USER_B = 'bab21860-bf43-4bd7-b8bb-ef7c031fb433';
export async function testDatabase() {
  const db = new PGlite();
  await db.exec(`create role anon nologin; create role authenticated nologin;
  create schema auth; create table auth.users(id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  grant usage on schema auth,public to authenticated,anon;
  grant execute on function auth.uid() to authenticated,anon;
  insert into auth.users(id) values ('${USER_A}'),('${USER_B}');`);
  await db.exec(
    readFileSync(
      new URL(
        '../../supabase/migrations/20260912092032_initial_workout_schema.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  );
  return db;
}
export async function asUser(db: PGlite, user = USER_A) {
  await db.exec(
    `set role authenticated; select set_config('request.jwt.claim.sub','${user}',false)`,
  );
}
