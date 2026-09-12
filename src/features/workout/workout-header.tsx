import { ArrowUpRight, Clock3 } from 'lucide-react';
import type { WorkoutDay } from '@/types/workout';
import { ROUTINE_PHASE } from '@/config/routine';
export function WorkoutHeader({
  day,
  active,
  done,
  total,
}: {
  day: WorkoutDay;
  active: boolean;
  done: number;
  total: number;
}) {
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">UN DÍA MÁS FUERTE</span>
          <h1>
            Hoy<span className="title-dot">.</span>
          </h1>
        </div>
        <span className="date-pill">{ROUTINE_PHASE}</span>
      </div>
      <section className="workout-hero">
        <div className="hero-top">
          <span className="pill">
            {active ? 'EN CURSO' : 'TU SIGUIENTE PASO'}
          </span>
          <ArrowUpRight size={23} />
        </div>
        <span className="day-label">{day.label}</span>
        <h2>{day.name}</h2>
        <p>Sin prisa. Con intención. A tu ritmo.</p>
        <div className="hero-meta">
          <span>{day.exercises.length} ejercicios</span>
          <span>RIR 3</span>
          <span>
            <Clock3 size={14} /> 45–60 min
          </span>
        </div>
        <div className="hero-progress">
          <div style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
        <div className="hero-footer">
          <span>
            {active ? 'Cada serie suma' : 'La constancia empieza aquí'}
          </span>
          <span>
            {done} de {total} series
          </span>
        </div>
      </section>
    </>
  );
}
