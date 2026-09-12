import { TrendingUp } from 'lucide-react';
import { requireUser } from '@/features/auth/service';
import { exerciseHistory } from '@/features/workout/repository';
import { allExercises } from '@/config/routine';
import { progressPoints } from '@/features/progress/model';
import { ExerciseSelector } from '@/features/progress/exercise-selector';
import { ProgressChart } from '@/features/progress/progress-chart';
import { EmptyState } from '@/components/ui/states';
export const metadata = { title: 'Progreso' };
export default async function Progress({
  searchParams,
}: {
  searchParams: Promise<{ ejercicio?: string }>;
}) {
  const query = await searchParams;
  const exercise =
    allExercises.find((e) => e.id === query.ejercicio) ?? allExercises[0];
  const { client } = await requireUser();
  const history = await exerciseHistory(client, exercise.id, 30);
  const points = progressPoints(history);
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">PEQUEÑOS PASOS, CAMBIOS REALES</span>
          <h1>
            Progreso<span className="title-dot">.</span>
          </h1>
        </div>
        <TrendingUp className="page-icon" />
      </div>
      <p className="page-description">Compite solo con tu versión de ayer.</p>
      <ExerciseSelector id={exercise.id} />
      {!points.length ? (
        <EmptyState title="Todo progreso tiene un comienzo">
          Completa una sesión de este ejercicio para ver su evolución.
        </EmptyState>
      ) : (
        <>
          <p className="muted chart-period">
            {points.length === 1
              ? 'Última sesión con este ejercicio'
              : `Últimas ${points.length} sesiones con este ejercicio`}
          </p>
          {exercise.targetUnit === 'seconds' ? (
            <ProgressChart
              points={points}
              metric="seconds"
              title="Duración máxima"
              unit="s"
            />
          ) : (
            <>
              <ProgressChart
                points={points}
                metric="maxWeight"
                title="Peso máximo"
                unit="kg"
              />
              <ProgressChart
                points={points}
                metric="volume"
                title="Volumen total"
                unit="kg"
              />
              {exercise.trackOneRM && (
                <ProgressChart
                  points={points}
                  metric="oneRM"
                  title="1RM estimado"
                  unit="kg"
                />
              )}
            </>
          )}
          <p className="training-note">
            {exercise.targetUnit === 'seconds'
              ? 'Duración de la serie más larga, por lado.'
              : 'Volumen = peso × repeticiones. El peso registrado se usa tal cual, sin duplicarlo por lado ni por mancuerna.'}
            {exercise.trackOneRM && (
              <>
                <br />
                1RM calculado con Epley. Es una estimación, no una indicación
                para probar tu máximo.
              </>
            )}
          </p>
        </>
      )}
    </>
  );
}
