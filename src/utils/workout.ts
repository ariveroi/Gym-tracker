import type {
  ExerciseSet,
  WorkoutDayId,
  WorkoutSession,
} from '@/types/workout';
export function getNextWorkoutDay(
  sessions: Pick<
    WorkoutSession,
    'status' | 'completed_at' | 'workout_day_id'
  >[],
): WorkoutDayId {
  const last = sessions
    .filter((s) => s.status === 'completed' && s.completed_at)
    .sort(
      (a, b) => Date.parse(b.completed_at!) - Date.parse(a.completed_at!),
    )[0];
  return last?.workout_day_id === 'day-1' ? 'day-2' : 'day-1';
}
export function estimated1RM(weight: number, reps: number) {
  return Number.isFinite(weight) &&
    Number.isFinite(reps) &&
    weight > 0 &&
    reps > 0
    ? weight * (1 + reps / 30)
    : 0;
}
export function calculateVolume(
  sets: Pick<ExerciseSet, 'weight_kg' | 'reps' | 'completed_at'>[],
) {
  return sets.reduce(
    (total, s) =>
      total +
      (s.completed_at && (s.weight_kg ?? 0) > 0 && (s.reps ?? 0) > 0
        ? s.weight_kg! * s.reps!
        : 0),
    0,
  );
}
export function summarizeSession(session: {
  started_at: string;
  completed_at: string | null;
  exercise_sets: ExerciseSet[];
}) {
  const sets = session.exercise_sets.filter((s) => s.completed_at);
  return {
    minutes: Math.max(
      0,
      Math.round(
        (Date.parse(session.completed_at ?? new Date().toISOString()) -
          Date.parse(session.started_at)) /
          60000,
      ),
    ),
    exercises: new Set(sets.map((s) => s.exercise_id)).size,
    sets: sets.length,
    volume: calculateVolume(sets),
  };
}
export const number = (value: number) =>
  new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(value);
export const dateLabel = (date: string) =>
  new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/Madrid',
  }).format(new Date(date));
export function setLabel(
  s: Pick<ExerciseSet, 'weight_kg' | 'reps' | 'duration_seconds'>,
) {
  return s.duration_seconds !== null
    ? `${s.duration_seconds} s`
    : `${number(s.weight_kg ?? 0)} kg × ${s.reps ?? '—'}`;
}
