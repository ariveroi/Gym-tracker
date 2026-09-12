import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import type { PGlite } from '@electric-sql/pglite';
import { testDatabase, asUser, USER_A, USER_B } from './helpers/database';
import { workoutDays, ROUTINE_VERSION } from '@/config/routine';
let db: PGlite;
beforeAll(async () => {
  db = await testDatabase();
}, 20000);
afterAll(async () => {
  await db?.close();
});
async function start(day = 'day-1') {
  const result = await db.query<{ id: string }>(
    'select public.start_workout($1,$2,$3) as id',
    [
      day,
      ROUTINE_VERSION,
      JSON.stringify(workoutDays[day as 'day-1' | 'day-2']),
    ],
  );
  return result.rows[0].id;
}
describe('migration, RLS and lifecycle on PostgreSQL', () => {
  let id: string;
  let setId: string;
  it('atomically seeds a session and recovers it without duplicates', async () => {
    await asUser(db);
    id = await start();
    expect(await start()).toBe(id);
    const rows = await db.query<{ id: string }>(
      'select id from public.exercise_sets order by exercise_id,set_number',
    );
    expect(rows.rows).toHaveLength(15);
    setId = rows.rows[0].id;
  });
  it('does not permit completion without a completed set', async () => {
    await expect(
      db.query('select public.finish_workout($1)', [id]),
    ).rejects.toThrow('Complete at least one set');
  });
  it('isolates both tables from another user', async () => {
    await asUser(db, USER_B);
    expect(
      (await db.query('select * from public.workout_sessions')).rows,
    ).toHaveLength(0);
    expect(
      (await db.query('select * from public.exercise_sets')).rows,
    ).toHaveLength(0);
    expect(
      (
        await db.query(
          'update public.exercise_sets set weight_kg=99 where id=$1 returning id',
          [setId],
        )
      ).rows,
    ).toHaveLength(0);
    await expect(
      db.query('select public.finish_workout($1)', [id]),
    ).rejects.toThrow();
  });
  it('rejects cross-user ownership and set attachment', async () => {
    await expect(
      db.query(
        'insert into public.exercise_sets(workout_session_id,user_id,exercise_id,set_number) values ($1,$2,$3,20)',
        [id, USER_A, 'leg-press'],
      ),
    ).rejects.toThrow();
    await expect(
      db.query(
        'insert into public.exercise_sets(workout_session_id,user_id,exercise_id,set_number) values ($1,$2,$3,20)',
        [id, USER_B, 'leg-press'],
      ),
    ).rejects.toThrow();
  });
  it('denies anonymous reads and writes', async () => {
    await db.exec('set role anon');
    await expect(
      db.query('select * from public.workout_sessions'),
    ).rejects.toThrow();
    await expect(
      db.query('select public.start_workout($1,$2,$3)', [
        'day-1',
        ROUTINE_VERSION,
        JSON.stringify(workoutDays['day-1']),
      ]),
    ).rejects.toThrow();
    await asUser(db);
  });
  it('accepts valid decimal sets and rejects invalid mixed units', async () => {
    await db.query(
      'update public.exercise_sets set weight_kg=22.5,reps=10,completed_at=now() where id=$1',
      [setId],
    );
    await expect(
      db.query(
        'update public.exercise_sets set duration_seconds=30 where id=$1',
        [setId],
      ),
    ).rejects.toThrow();
  });
  it('adds and removes only extra sets', async () => {
    await expect(
      db.query('delete from public.exercise_sets where id=$1', [setId]),
    ).rejects.toThrow();
    const result = await db.query<{ id: string }>(
      'select public.add_workout_set($1,$2) as id',
      [id, 'leg-press'],
    );
    await db.query('delete from public.exercise_sets where id=$1', [
      result.rows[0].id,
    ]);
  });
  it('finishes idempotently and freezes completed sets', async () => {
    await db.query('select public.finish_workout($1)', [id]);
    await db.query('select public.finish_workout($1)', [id]);
    await expect(
      db.query('update public.exercise_sets set reps=9 where id=$1', [setId]),
    ).rejects.toThrow('No active session');
    await expect(
      db.query(
        "update public.workout_sessions set status='active',completed_at=null where id=$1",
        [id],
      ),
    ).rejects.toThrow('Session is immutable');
  });
  it('enforces alternating sequence after completion', async () => {
    await expect(start()).rejects.toThrow('Sequence changed');
    const next = await start('day-2');
    expect(next).not.toBe(id);
    expect(
      (
        await db.query(
          'select * from public.exercise_sets where workout_session_id=$1',
          [next],
        )
      ).rows,
    ).toHaveLength(17);
  });
  it('accepts duration-only records for timed exercises', async () => {
    await db.query(
      "update public.exercise_sets set duration_seconds=25,completed_at=now() where exercise_id='side-plank' and set_number=1",
    );
    await expect(
      db.query(
        "update public.exercise_sets set reps=20 where exercise_id='side-plank' and set_number=1",
      ),
    ).rejects.toThrow();
  });
});
