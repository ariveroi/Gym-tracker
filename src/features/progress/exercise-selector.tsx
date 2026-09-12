'use client';
import { useRouter } from 'next/navigation';
import { allExercises } from '@/config/routine';
export function ExerciseSelector({ id }: { id: string }) {
  const router = useRouter();
  return (
    <div className="exercise-select">
      <label htmlFor="exercise">EJERCICIO</label>
      <select
        id="exercise"
        value={id}
        onChange={(e) =>
          router.push(
            `/progreso?ejercicio=${encodeURIComponent(e.target.value)}`,
          )
        }
      >
        {allExercises.map((exercise) => (
          <option value={exercise.id} key={exercise.id}>
            {exercise.name}
          </option>
        ))}
      </select>
    </div>
  );
}
