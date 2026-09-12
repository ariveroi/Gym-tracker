import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { ArrowLeft, Check } from 'lucide-react';
import { requireUser } from '@/features/auth/service';
import { getSession } from '@/features/workout/repository';
import { dateLabel, setLabel } from '@/utils/workout';
import { SessionSummary } from '@/features/history/session-summary';
export default async function SessionDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ completado?: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { client } = await requireUser();
  const session = await getSession(client, id);
  if (!session || session.status !== 'completed') notFound();
  const { completado } = await searchParams;
  return (
    <>
      <Link className="back-link" href="/historial">
        <ArrowLeft size={17} /> Historial
      </Link>
      {completado === '1' && (
        <div className="success-banner">
          <Check size={22} />
          <div>
            <strong>Un paso más. Bien hecho.</strong>
            <p>Entrenamiento guardado. Tu siguiente día está listo.</p>
          </div>
        </div>
      )}
      <span className="eyebrow">{dateLabel(session.completed_at!)}</span>
      <h1 className="detail-title">
        {session.routine_snapshot.label}
        <br />
        <span>{session.routine_snapshot.name}</span>
      </h1>
      <SessionSummary session={session} />
      <div className="section-heading">
        <h2>Serie a serie</h2>
        <span>Registro completo</span>
      </div>
      {session.routine_snapshot.exercises.map((exercise) => {
        const sets = session.exercise_sets
          .filter((s) => s.exercise_id === exercise.id)
          .sort((a, b) => a.set_number - b.set_number);
        return (
          <section className="detail-card" key={exercise.id}>
            <h2>{exercise.name}</h2>
            {exercise.unilateral && (
              <p className="muted">
                Valores por lado; una serie incluye ambos lados.
              </p>
            )}
            <ol className="exact-sets">
              {sets.map((set) => (
                <li key={set.id}>
                  <span className="set-number">{set.set_number}</span>
                  <strong>
                    {set.completed_at ? setLabel(set) : 'Sin completar'}
                  </strong>
                  {set.completed_at && <Check size={17} />}
                </li>
              ))}
            </ol>
          </section>
        );
      })}
      <Link className="button primary" href="/">
        Ir al siguiente entrenamiento
      </Link>
    </>
  );
}
