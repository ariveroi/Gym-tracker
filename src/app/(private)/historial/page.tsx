import Link from 'next/link';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { requireUser } from '@/features/auth/service';
import { listSessionDetails } from '@/features/workout/repository';
import { dateLabel, number, summarizeSession } from '@/utils/workout';
import { EmptyState } from '@/components/ui/states';
export const metadata = { title: 'Historial' };
export default async function History({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const query = await searchParams;
  const page = Math.max(
    0,
    Math.min(10000, Number.parseInt(query.pagina ?? '0') || 0),
  );
  const { client } = await requireUser();
  const sessions = await listSessionDetails(client, page);
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">CADA SESIÓN CUENTA</span>
          <h1>
            Historial<span className="title-dot">.</span>
          </h1>
        </div>
        <CalendarDays className="page-icon" />
      </div>
      <p className="page-description">El camino que ya has recorrido.</p>
      {!sessions.length ? (
        <EmptyState title="Tu historia empieza aquí">
          {page
            ? 'No hay más sesiones en esta página.'
            : 'Completa tu primer entrenamiento y vuelve para ver cada serie, cada repetición y cada pequeño avance.'}
        </EmptyState>
      ) : (
        <div className="history-list">
          {sessions.map((session) => {
            const summary = summarizeSession(session);
            return (
              <Link
                href={`/historial/${session.id}`}
                key={session.id}
                className="history-card"
              >
                <div className="history-card-top">
                  <span>{dateLabel(session.completed_at!)}</span>
                  <ArrowUpRight size={19} />
                </div>
                <h2>
                  {session.routine_snapshot.label}{' '}
                  <span>· {session.routine_snapshot.name}</span>
                </h2>
                <div className="history-metrics">
                  <span>{summary.minutes} min</span>
                  <span>{summary.sets} series</span>
                  <span>{number(summary.volume)} kg</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <div className="pagination">
        {page > 0 && (
          <Link
            className="button secondary"
            href={`/historial?pagina=${page - 1}`}
          >
            Más recientes
          </Link>
        )}
        {sessions.length === 20 && (
          <Link
            className="button secondary"
            href={`/historial?pagina=${page + 1}`}
          >
            Anteriores
          </Link>
        )}
      </div>
    </>
  );
}
