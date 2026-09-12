import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/database';
import type {
  WorkoutDay,
  SessionWithSets,
  WorkoutSession,
  ExerciseSet,
  SetValues,
} from '@/types/workout';
import { ROUTINE_VERSION } from '@/config/routine';
type Client = SupabaseClient<Database>;
function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}
export async function getActiveSession(client: Client) {
  const { data, error } = await client
    .from('workout_sessions')
    .select('*')
    .eq('status', 'active')
    .maybeSingle();
  check(error);
  return data ? getSession(client, data.id) : null;
}
export async function getSession(
  client: Client,
  id: string,
): Promise<SessionWithSets | null> {
  const { data, error } = await client
    .from('workout_sessions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  check(error);
  if (!data) return null;
  const sets = await client
    .from('exercise_sets')
    .select('*')
    .eq('workout_session_id', id)
    .order('set_number');
  check(sets.error);
  return {
    ...data,
    routine_snapshot: data.routine_snapshot as unknown as WorkoutDay,
    exercise_sets: sets.data ?? [],
  };
}
export async function listSessions(
  client: Client,
  page = 0,
  limit = 20,
): Promise<WorkoutSession[]> {
  const { data, error } = await client
    .from('workout_sessions')
    .select('*')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);
  check(error);
  return (data ?? []) as unknown as WorkoutSession[];
}
export async function listSessionDetails(
  client: Client,
  page = 0,
  limit = 20,
): Promise<SessionWithSets[]> {
  const sessions = await listSessions(client, page, limit);
  if (!sessions.length) return [];
  const sets: ExerciseSet[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client
      .from('exercise_sets')
      .select('*')
      .in(
        'workout_session_id',
        sessions.map((s) => s.id),
      )
      .order('id')
      .range(offset, offset + 499);
    check(error);
    sets.push(...(data ?? []));
    if (!data || data.length < 500) break;
  }
  return sessions.map((s) => ({
    ...s,
    exercise_sets: sets
      .filter((row) => row.workout_session_id === s.id)
      .sort((a, b) => a.set_number - b.set_number),
  }));
}
export async function exerciseHistory(
  client: Client,
  exerciseId: string,
  limit = 30,
) {
  const result: SessionWithSets[] = [];
  for (let page = 0; result.length < limit; page++) {
    const sessions = await listSessionDetails(client, page, 20);
    result.push(
      ...sessions
        .filter((s) =>
          s.exercise_sets.some(
            (row) => row.exercise_id === exerciseId && row.completed_at,
          ),
        )
        .map((s) => ({
          ...s,
          exercise_sets: s.exercise_sets.filter(
            (row) => row.exercise_id === exerciseId,
          ),
        })),
    );
    if (sessions.length < 20) break;
  }
  return result.slice(0, limit);
}
export async function previousPerformances(
  client: Client,
  ids: string[],
): Promise<Record<string, ExerciseSet[]>> {
  const result: Record<string, ExerciseSet[]> = {};
  const pending = new Set(ids);
  for (let page = 0; pending.size > 0; page++) {
    const sessions = await listSessionDetails(client, page, 20);
    for (const session of sessions) {
      for (const id of pending) {
        const sets = session.exercise_sets.filter(
          (s) => s.exercise_id === id && s.completed_at,
        );
        if (sets.length) {
          result[id] = sets;
          pending.delete(id);
        }
      }
    }
    if (sessions.length < 20) break;
  }
  return result;
}
export async function startSession(client: Client, day: WorkoutDay) {
  const { data, error } = await client.rpc('start_workout', {
    p_day: day.id,
    p_version: ROUTINE_VERSION,
    p_snapshot: day as unknown as Json,
  });
  check(error);
  return (await getSession(client, data!))!;
}
export async function updateSet(
  client: Client,
  id: string,
  values: SetValues,
  completed: boolean,
) {
  const { data, error } = await client
    .from('exercise_sets')
    .update({
      ...values,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single();
  check(error);
  return data!;
}
export async function addSet(
  client: Client,
  sessionId: string,
  exerciseId: string,
) {
  const { data, error } = await client.rpc('add_workout_set', {
    p_session: sessionId,
    p_exercise: exerciseId,
  });
  check(error);
  const row = await client
    .from('exercise_sets')
    .select('*')
    .eq('id', data!)
    .single();
  check(row.error);
  return row.data!;
}
export async function removeSet(client: Client, id: string) {
  const { data, error } = await client
    .from('exercise_sets')
    .delete()
    .eq('id', id)
    .select('id')
    .single();
  check(error);
  return data!.id;
}
export async function finishSession(client: Client, id: string) {
  const { error } = await client.rpc('finish_workout', { p_session: id });
  check(error);
  return (await getSession(client, id))!;
}
