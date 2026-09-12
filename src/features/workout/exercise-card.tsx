'use client';
import Link from 'next/link';
import { Plus, Minus, ArrowUpRight, ChevronDown } from 'lucide-react';
import type {
  ExerciseDefinition,
  ExerciseSet,
  SetValues,
} from '@/types/workout';
import { targetLabel } from '@/config/routine';
import { PreviousPerformance } from './previous-performance';
import { SetRow } from './set-row';
interface Props {
  exercise: ExerciseDefinition;
  index: number;
  sets: ExerciseSet[];
  previous: ExerciseSet[];
  active: boolean;
  busy: boolean;
  onSave: (
    row: ExerciseSet,
    values: SetValues,
    restSeconds: number,
    name: string,
  ) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}
export function ExerciseCard({
  exercise,
  index,
  sets,
  previous,
  active,
  busy,
  onSave,
  onAdd,
  onRemove,
}: Props) {
  const done = sets.filter((s) => s.completed_at).length;
  const sorted = [...sets].sort((a, b) => a.set_number - b.set_number);
  const last = sorted.at(-1);
  return (
    <article className="exercise-card">
      <details open={active || undefined}>
        <summary>
          <span
            className={`exercise-index ${done === sets.length && done ? 'finished' : ''}`}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="exercise-title">
            <h3>
              <Link href={`/ejercicio/${exercise.id}`}>{exercise.name}</Link>
            </h3>
            <p>
              {exercise.sets} × {targetLabel(exercise)}{' '}
              <span>· RIR {exercise.rir}</span>
            </p>
          </div>
          <div className="exercise-progress">
            <span>
              {done}/{sets.length || exercise.sets}
            </span>
            <ChevronDown size={15} />
          </div>
        </summary>
        <div className="exercise-body">
          <PreviousPerformance sets={previous} />
          {active && (
            <>
              <div
                className={`set-heading ${exercise.targetUnit === 'seconds' ? 'timed' : ''}`}
              >
                <span>SERIE</span>
                <span>ANTERIOR</span>
                {exercise.targetUnit === 'seconds' ? (
                  <span>SEGUNDOS</span>
                ) : (
                  <>
                    <span>KG</span>
                    <span>REPS</span>
                  </>
                )}
                <span>HECHO</span>
              </div>
              {sorted.map((row) => (
                <SetRow
                  key={row.id}
                  row={row}
                  previous={previous.find(
                    (p) => p.set_number === row.set_number,
                  )}
                  exercise={exercise}
                  busy={busy}
                  onSave={onSave}
                />
              ))}
              <div className="extra-sets">
                <button disabled={busy || sets.length >= 30} onClick={onAdd}>
                  <Plus size={15} /> Añadir serie
                </button>
                {last && last.set_number > exercise.sets && (
                  <button
                    disabled={busy}
                    onClick={() => {
                      if (
                        !last.completed_at ||
                        window.confirm(
                          '¿Eliminar esta serie adicional completada?',
                        )
                      )
                        onRemove(last.id);
                    }}
                    aria-label={`Eliminar última serie de ${exercise.name}`}
                  >
                    <Minus size={15} /> Quitar
                  </button>
                )}
              </div>
            </>
          )}
          <Link className="technique-link" href={`/ejercicio/${exercise.id}`}>
            Ficha y técnica <ArrowUpRight size={14} />
          </Link>
        </div>
      </details>
      {!active && (
        <div className="preview-previous">
          <PreviousPerformance sets={previous} />
        </div>
      )}
    </article>
  );
}
