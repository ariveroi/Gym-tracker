'use client';
import { ArrowRight, CheckCheck } from 'lucide-react';
import type { WorkoutDay, SessionWithSets, ExerciseSet } from '@/types/workout';
import { useWorkoutSession } from '@/hooks/use-workout-session';
import { WorkoutHeader } from './workout-header';
import { ExerciseCard } from './exercise-card';
import { ErrorMessage } from '@/components/ui/states';
export function WorkoutScreen({
  day,
  initial,
  previous,
}: {
  day: WorkoutDay;
  initial: SessionWithSets | null;
  previous: Record<string, ExerciseSet[]>;
}) {
  const workout = useWorkoutSession(initial);
  const current = workout.session?.routine_snapshot ?? day;
  const total =
    workout.session?.exercise_sets.length ??
    current.exercises.reduce((n, e) => n + e.sets, 0);
  const done =
    workout.session?.exercise_sets.filter((s) => s.completed_at).length ?? 0;
  return (
    <>
      <WorkoutHeader
        day={current}
        active={!!workout.session}
        done={done}
        total={total}
      />
      {!workout.session && (
        <button
          className="button primary start-button"
          disabled={workout.busy}
          onClick={workout.start}
        >
          {workout.busy ? 'Preparando tu sesión…' : 'Empezar entrenamiento'}
          <ArrowRight size={18} />
        </button>
      )}
      <div className="workout-feedback">
        <ErrorMessage message={workout.error} />
      </div>
      <div className="section-heading">
        <h2>Tu entrenamiento</h2>
        <span>{current.exercises.length} ejercicios</span>
      </div>
      <div className="exercise-list">
        {current.exercises.map((exercise, index) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            index={index}
            sets={
              workout.session?.exercise_sets.filter(
                (s) => s.exercise_id === exercise.id,
              ) ?? []
            }
            previous={previous[exercise.id] ?? []}
            active={!!workout.session}
            busy={workout.busy}
            onSave={workout.save}
            onAdd={() => workout.add(exercise.id)}
            onRemove={workout.remove}
          />
        ))}
      </div>
      {workout.session && (
        <div className="finish-section">
          <p className="muted">
            {done} de {total} series guardadas · Puedes continuar más tarde.
          </p>
          <button
            className="button primary"
            disabled={workout.busy || done === 0}
            onClick={() => {
              if (
                done === total ||
                window.confirm(
                  `Quedan ${total - done} series sin completar. ¿Finalizar igualmente? Las series no completadas quedarán en el historial.`,
                )
              )
                workout.finish();
            }}
          >
            {workout.busy ? 'Guardando…' : 'Finalizar entrenamiento'}
            <CheckCheck size={19} />
          </button>
          <ErrorMessage message={workout.error} />
        </div>
      )}
      <p className="training-note">
        Día 1 → Día 2 → Repite.
        <br />
        Tu rutina avanza cuando tú lo haces.
      </p>
    </>
  );
}
