'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type {
  ActionResult,
  ExerciseSet,
  SessionWithSets,
  SetValues,
} from '@/types/workout';
import {
  beginWorkout,
  saveWorkoutSet,
  addWorkoutSet,
  removeWorkoutSet,
  completeWorkout,
} from '@/features/workout/actions';
import { useRestTimerActions } from './use-rest-timer';
export function useWorkoutSession(initial: SessionWithSets | null) {
  const [session, setSession] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const router = useRouter();
  const timer = useRestTimerActions();
  async function run<T>(
    action: () => Promise<ActionResult<T>>,
    success: (data: T) => void,
  ) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await action();
      if (result.error) setError(result.error);
      else if (result.data !== undefined) success(result.data);
    } catch {
      setError(
        'No se pudo conectar. Tus cambios no se han confirmado: inténtalo de nuevo.',
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const update = (row: ExerciseSet) =>
    setSession((s) =>
      s
        ? {
            ...s,
            exercise_sets: s.exercise_sets.map((old) =>
              old.id === row.id ? row : old,
            ),
          }
        : s,
    );
  return {
    session,
    busy,
    error,
    start: () => run(beginWorkout, setSession),
    save: (
      row: ExerciseSet,
      values: SetValues,
      restSeconds: number,
      name: string,
    ) =>
      run(
        () =>
          saveWorkoutSet({
            id: row.id,
            ...values,
            completed: !row.completed_at,
          }),
        (saved) => {
          update(saved);
          if (saved.completed_at) timer.start(restSeconds, name);
        },
      ),
    add: (exerciseId: string) =>
      session &&
      run(
        () => addWorkoutSet(session.id, exerciseId),
        (row) =>
          setSession((s) =>
            s ? { ...s, exercise_sets: [...s.exercise_sets, row] } : s,
          ),
      ),
    remove: (id: string) =>
      run(
        () => removeWorkoutSet(id),
        (removed) =>
          setSession((s) =>
            s
              ? {
                  ...s,
                  exercise_sets: s.exercise_sets.filter(
                    (row) => row.id !== removed,
                  ),
                }
              : s,
          ),
      ),
    finish: () =>
      session &&
      run(
        () => completeWorkout(session.id),
        (completed) => {
          timer.stop();
          router.push(`/historial/${completed.id}?completado=1`);
          router.refresh();
        },
      ),
  };
}
