import type { ExerciseSet, WorkoutSession } from './workout';
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
type SessionRow = Omit<WorkoutSession, 'routine_snapshot'> & {
  routine_snapshot: Json;
};
type Table<Row, Insert = Partial<Row>> = {
  Row: { [K in keyof Row]: Row[K] };
  Insert: { [K in keyof Insert]: Insert[K] };
  Update: { [K in keyof Row]?: Row[K] };
  Relationships: [];
};
export interface Database {
  public: {
    Tables: {
      workout_sessions: Table<SessionRow>;
      exercise_sets: Table<ExerciseSet>;
    };
    Views: { [key: string]: never };
    Functions: {
      start_workout: {
        Args: { p_day: string; p_version: string; p_snapshot: Json };
        Returns: string;
      };
      finish_workout: { Args: { p_session: string }; Returns: string };
      add_workout_set: {
        Args: { p_session: string; p_exercise: string };
        Returns: string;
      };
    };
    Enums: { [key: string]: never };
    CompositeTypes: { [key: string]: never };
  };
}
