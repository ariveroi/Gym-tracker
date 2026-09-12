/** Test-only GoTrue/PostgREST subset backed by the real migration in PGlite.
 * Binds loopback only. Never imported by the application or deployed.
 * It is NOT a replacement for testing against a real Supabase project.
 */
import { createServer } from 'node:http';
import { randomUUID, randomBytes, createHmac } from 'node:crypto';
import { writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
const db = new PGlite();
const uid = randomUUID();
await db.exec(
  `create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema public,auth to anon,authenticated;grant execute on function auth.uid() to authenticated;`,
);
await db.query('insert into auth.users values ($1)', [uid]);
await db.exec(
  readFileSync(
    new URL(
      '../supabase/migrations/20260912092032_initial_workout_schema.sql',
      import.meta.url,
    ),
    'utf8',
  ),
);
await db.exec('set role authenticated');
await db.query("select set_config('request.jwt.claim.sub',$1,false)", [uid]);
const email = 'test@pulso.local';
const password = randomBytes(24).toString('hex');
const secret = randomBytes(32);
const header = Buffer.from(
  JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
).toString('base64url');
const claims = Buffer.from(
  JSON.stringify({
    sub: uid,
    aud: 'authenticated',
    role: 'authenticated',
    email,
    exp: Math.floor(Date.now() / 1000) + 86400,
    iat: Math.floor(Date.now() / 1000),
  }),
).toString('base64url');
const token = `${header}.${claims}.${createHmac('sha256', secret).update(`${header}.${claims}`).digest('base64url')}`;
const user = {
  id: uid,
  aud: 'authenticated',
  role: 'authenticated',
  email,
  email_confirmed_at: new Date().toISOString(),
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: {},
  created_at: new Date().toISOString(),
  identities: [],
};
writeFileSync(
  join(tmpdir(), 'pulso-browser-fixture.json'),
  JSON.stringify({ email, password }),
  { mode: 0o600 },
);
const tables = {
  workout_sessions: new Set([
    'id',
    'user_id',
    'workout_day_id',
    'routine_version',
    'routine_snapshot',
    'started_at',
    'completed_at',
    'status',
    'created_at',
  ]),
  exercise_sets: new Set([
    'id',
    'workout_session_id',
    'user_id',
    'exercise_id',
    'set_number',
    'weight_kg',
    'reps',
    'duration_seconds',
    'completed_at',
    'created_at',
  ]),
};
let failNextWrite = false;
const server = createServer(async (req, res) => {
  function send(status, data) {
    res.writeHead(status, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    });
    res.end(data === undefined ? undefined : JSON.stringify(data));
  }
  try {
    if (req.method === 'OPTIONS') return send(200, {});
    const url = new URL(req.url, 'http://127.0.0.1:54329');
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : {};
    if (url.pathname === '/health') return send(200, { ok: true });
    if (url.pathname === '/test/fail-next-write' && req.method === 'POST') {
      failNextWrite = true;
      return send(200, {});
    }
    if (url.pathname === '/auth/v1/token') {
      if (body.email !== email || body.password !== password)
        return send(400, {
          error: 'invalid_grant',
          error_description: 'Invalid login credentials',
        });
      return send(200, {
        access_token: token,
        token_type: 'bearer',
        expires_in: 86400,
        expires_at: Math.floor(Date.now() / 1000) + 86400,
        refresh_token: randomBytes(24).toString('hex'),
        user,
      });
    }
    if (req.headers.authorization !== `Bearer ${token}`)
      return send(401, { message: 'Unauthorized' });
    if (url.pathname === '/auth/v1/user') return send(200, user);
    if (url.pathname === '/auth/v1/logout') return send(204);
    if (req.method !== 'GET' && failNextWrite) {
      failNextWrite = false;
      return send(503, { message: 'Injected test network failure' });
    }
    if (url.pathname.startsWith('/rest/v1/rpc/')) {
      const name = url.pathname.split('/').at(-1);
      const rpc = {
        start_workout: ['p_day', 'p_version', 'p_snapshot'],
        finish_workout: ['p_session'],
        add_workout_set: ['p_session', 'p_exercise'],
      };
      if (!rpc[name]) return send(404, {});
      const args = rpc[name];
      const result = await db.query(
        `select public.${name}(${args.map((_, i) => `$${i + 1}`).join(',')}) as result`,
        args.map((k) =>
          typeof body[k] === 'object' ? JSON.stringify(body[k]) : body[k],
        ),
      );
      return send(200, result.rows[0].result);
    }
    const table = url.pathname.split('/').at(-1);
    const columns = tables[table];
    if (!columns) return send(404, {});
    const params = [];
    const bind = (value) => {
      params.push(value);
      return `$${params.length}`;
    };
    const filters = [];
    for (const [key, value] of url.searchParams) {
      if (!columns.has(key)) continue;
      if (value.startsWith('eq.'))
        filters.push(`${key}=${bind(value.slice(3))}`);
      else if (value.startsWith('in.('))
        filters.push(
          `${key} in (${value
            .slice(4, -1)
            .split(',')
            .map((v) => bind(v.replaceAll('"', '')))
            .join(',')})`,
        );
    }
    const where = filters.length ? ' where ' + filters.join(' and ') : '';
    let sql;
    if (req.method === 'GET') sql = `select * from public.${table}${where}`;
    else if (req.method === 'PATCH') {
      // Bind update parameters after filter parameters; PostgreSQL accepts arbitrary placeholder order.
      const updates = Object.entries(body)
        .filter(([key]) => columns.has(key))
        .map(([key, value]) => `${key}=${bind(value)}`);
      sql = `update public.${table} set ${updates.join(',')}${where} returning *`;
    } else if (req.method === 'DELETE')
      sql = `delete from public.${table}${where} returning *`;
    else return send(405, {});
    if (req.method === 'GET') {
      const order = url.searchParams.get('order');
      if (order) {
        const [column, direction] = order.split('.');
        if (columns.has(column))
          sql += ` order by ${column} ${direction === 'desc' ? 'desc' : 'asc'}`;
      }
      const limit = Math.min(
        1000,
        Number(url.searchParams.get('limit') ?? 1000),
      );
      const offset = Number(url.searchParams.get('offset') ?? 0);
      sql += ` limit ${bind(limit)} offset ${bind(offset)}`;
    }
    const result = await db.query(sql, params);
    const rows = result.rows.map((row) => ({
      ...row,
      ...('weight_kg' in row
        ? { weight_kg: row.weight_kg === null ? null : Number(row.weight_kg) }
        : {}),
    }));
    if (String(req.headers.accept).includes('vnd.pgrst.object')) {
      if (rows.length !== 1)
        return send(406, {
          code: 'PGRST116',
          details: `The result contains ${rows.length} rows`,
          message: 'JSON object requested, multiple (or no) rows returned',
        });
      return send(200, rows[0]);
    }
    return send(200, rows);
  } catch (error) {
    send(400, { message: error.message, code: error.code ?? 'TEST_ERROR' });
  }
});
server.listen(54329, '127.0.0.1', () =>
  console.log(
    'Test-only backend ready on 127.0.0.1:54329. Credentials in the temporary fixture file.',
  ),
);
