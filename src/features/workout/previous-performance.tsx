import type { ExerciseSet } from '@/types/workout';
import { setLabel } from '@/utils/workout';
export function PreviousPerformance({ sets }: { sets: ExerciseSet[] }) {
  return (
    <div className="previous">
      <span>ÚLTIMA VEZ</span>
      <p>
        {sets.length
          ? sets.map(setLabel).join(' · ')
          : 'Tu primera vez. Aquí empieza tu referencia.'}
      </p>
    </div>
  );
}
