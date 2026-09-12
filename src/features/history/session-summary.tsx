import { summarizeSession, number } from '@/utils/workout';
import type { SessionWithSets } from '@/types/workout';
export function SessionSummary({ session }: { session: SessionWithSets }) {
  const summary = summarizeSession(session);
  return (
    <div className="summary-grid">
      <div>
        <strong>
          {summary.minutes}
          <small> min</small>
        </strong>
        <span>Duración</span>
      </div>
      <div>
        <strong>{summary.exercises}</strong>
        <span>Ejercicios</span>
      </div>
      <div>
        <strong>{summary.sets}</strong>
        <span>Series</span>
      </div>
      <div>
        <strong>
          {number(summary.volume)}
          <small> kg</small>
        </strong>
        <span>Volumen</span>
      </div>
    </div>
  );
}
