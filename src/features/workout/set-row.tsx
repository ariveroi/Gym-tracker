'use client';
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import type {
  ExerciseDefinition,
  ExerciseSet,
  SetValues,
} from '@/types/workout';
import { setLabel } from '@/utils/workout';
interface Props {
  row: ExerciseSet;
  previous?: ExerciseSet;
  exercise: ExerciseDefinition;
  busy: boolean;
  onSave: (
    row: ExerciseSet,
    values: SetValues,
    restSeconds: number,
    name: string,
  ) => void;
}
export function SetRow({ row, previous, exercise, busy, onSave }: Props) {
  const key = `gym:draft:${row.user_id}:${row.id}`;
  const initial = {
    weight: row.weight_kg?.toString() ?? '',
    reps: row.reps?.toString() ?? '',
    seconds: row.duration_seconds?.toString() ?? '',
  };
  const [values, setValues] = useState(initial);
  useEffect(() => {
    if (!row.completed_at) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const data = JSON.parse(raw);
          if (
            ['weight', 'reps', 'seconds'].every(
              (k) => typeof data[k] === 'string',
            )
          ) {
            // Restore an unsubmitted draft only after the browser storage is available.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setValues(data);
          }
        }
      } catch {
        /* Los valores guardados en Supabase siguen disponibles. */
      }
    } else {
      try {
        localStorage.removeItem(key);
      } catch {}
    }
  }, [key, row.completed_at]);
  const change = (field: keyof typeof values, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
  };
  const numeric = (value: string) =>
    value.trim() === '' ? null : Number(value.replace(',', '.'));
  const timed = exercise.targetUnit === 'seconds';
  const complete = !!row.completed_at;
  return (
    <form
      className={`set-row ${complete ? 'set-complete' : ''} ${timed ? 'timed' : ''}`}
      onSubmit={(event) => {
        event.preventDefault();
        onSave(
          row,
          complete
            ? {
                weight_kg: row.weight_kg,
                reps: row.reps,
                duration_seconds: row.duration_seconds,
              }
            : {
                weight_kg: timed ? null : numeric(values.weight),
                reps: timed ? null : numeric(values.reps),
                duration_seconds: timed ? numeric(values.seconds) : null,
              },
          exercise.restSeconds,
          exercise.name,
        );
      }}
    >
      <span className="set-number">{row.set_number}</span>
      <span className="previous-cell">
        {previous ? setLabel(previous) : '—'}
      </span>
      {timed ? (
        <input
          aria-label={`Segundos serie ${row.set_number}`}
          inputMode="numeric"
          type="text"
          pattern="[0-9]+"
          required
          disabled={complete || busy}
          value={values.seconds}
          onChange={(e) => change('seconds', e.target.value)}
          placeholder={`${exercise.minReps}`}
        />
      ) : (
        <>
          <input
            aria-label={`Kg serie ${row.set_number}`}
            inputMode="decimal"
            type="text"
            pattern="[0-9]+([.,][0-9]{1,2})?"
            required
            disabled={complete || busy}
            value={values.weight}
            onChange={(e) => change('weight', e.target.value)}
            placeholder={previous?.weight_kg?.toString() ?? '0'}
          />
          <input
            aria-label={`Repeticiones serie ${row.set_number}`}
            inputMode="numeric"
            type="text"
            pattern="[0-9]+"
            required
            disabled={complete || busy}
            value={values.reps}
            onChange={(e) => change('reps', e.target.value)}
            placeholder={previous?.reps?.toString() ?? `${exercise.minReps}`}
          />
        </>
      )}
      <button
        type="submit"
        className="set-check"
        disabled={busy}
        aria-label={`${complete ? 'Desmarcar' : 'Completar'} serie ${row.set_number}`}
        title={complete ? 'Desmarcar para editar' : 'Completar serie'}
      >
        <Check size={19} />
      </button>
    </form>
  );
}
