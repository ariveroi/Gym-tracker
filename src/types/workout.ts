export type WorkoutDayId = 'day-1' | 'day-2';
export interface ExerciseDefinition {
  id: string;
  name: string;
  sets: number;
  minReps: number;
  maxReps: number;
  targetUnit: 'reps' | 'seconds';
  unilateral: boolean;
  rir: number;
  restSeconds: number;
  videoUrl: string | null;
  instructions?: string;
  trackOneRM: boolean;
}
export interface WorkoutDay {
  id: WorkoutDayId;
  label: string;
  name: string;
  exercises: ExerciseDefinition[];
}
export interface WorkoutSession {
  id: string;
  user_id: string;
  workout_day_id: WorkoutDayId;
  routine_version: string;
  routine_snapshot: WorkoutDay;
  started_at: string;
  completed_at: string | null;
  status: 'active' | 'completed';
  created_at: string;
}
export interface ExerciseSet {
  id: string;
  workout_session_id: string;
  user_id: string;
  exercise_id: string;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  duration_seconds: number | null;
  completed_at: string | null;
  created_at: string;
}
export type SessionWithSets = WorkoutSession & { exercise_sets: ExerciseSet[] };
export type SetValues = Pick<
  ExerciseSet,
  'weight_kg' | 'reps' | 'duration_seconds'
>;
export type ActionResult<T> =
  { data: T; error?: never } | { data?: never; error: string };
