import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { allExercises, targetLabel } from '@/config/routine';
import { requireUser } from '@/features/auth/service';
import {
  exerciseHistory,
  getActiveSession,
} from '@/features/workout/repository';
import { dateLabel, setLabel } from '@/utils/workout';
import { EmptyState } from '@/components/ui/states';
export default async function ExerciseDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { client } = await requireUser();
  const active = await getActiveSession(client);
  const exercise =
    active?.routine_snapshot.exercises.find((e) => e.id === id) ??
    allExercises.find((e) => e.id === id);
  if (!exercise) notFound();
  const history = await exerciseHistory(client, id, 5);
  const video =
    exercise.videoUrl ??
    `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercise.name} técnica correcta`)}`;
  return (
    <>
      <Link className="back-link" href="/">
        <ArrowLeft size={17} /> Hoy
      </Link>
      <span className="eyebrow">CONOCE TU MOVIMIENTO</span>
      <h1 className="detail-title">{exercise.name}</h1>
      <div className="exercise-specs">
        <span>
          {exercise.sets} × {targetLabel(exercise)}
        </span>
        <span>RIR {exercise.rir}</span>
        <span>{exercise.restSeconds} s descanso</span>
      </div>
      <section className="detail-card">
        <h2>La técnica primero</h2>
        <p className="instructions">{exercise.instructions}</p>
        <p className="muted">
          {exercise.targetUnit === 'seconds'
            ? 'Mantén la posición con control y sin perder la alineación.'
            : `Termina cada serie sintiendo que podrías hacer unas ${exercise.rir} repeticiones más.`}
          {exercise.unilateral
            ? ' Completa ambos lados antes de marcar la serie.'
            : ''}
        </p>
        <a
          className="button secondary"
          href={video}
          target="_blank"
          rel="noopener noreferrer"
        >
          {exercise.videoUrl ? 'Ver técnica' : 'Buscar técnica en YouTube'}
          <ArrowUpRight size={17} />
        </a>
      </section>
      <div className="section-heading">
        <h2>Últimas sesiones</h2>
        <span>{history.length} registros</span>
      </div>
      {!history.length ? (
        <EmptyState title="Aún sin registros">
          Tu primera sesión será el punto de partida.
        </EmptyState>
      ) : (
        history.map((session, index) => (
          <Link
            className="detail-card history-detail-link"
            key={session.id}
            href={`/historial/${session.id}`}
          >
            <div className="section-heading">
              <h2>
                {index === 0 ? 'Última vez' : dateLabel(session.completed_at!)}
              </h2>
              {index === 0 && <span>{dateLabel(session.completed_at!)}</span>}
            </div>
            <div className="previous-chips">
              {session.exercise_sets
                .filter((s) => s.completed_at)
                .map((s) => (
                  <span key={s.id}>{setLabel(s)}</span>
                ))}
            </div>
          </Link>
        ))
      )}
    </>
  );
}
