'use client';
import { Pause, Play, RotateCcw, X } from 'lucide-react';
import { useRestTimer } from '@/hooks/use-rest-timer';
import { formatTime } from '@/utils/timer';
export function RestTimer() {
  const timer = useRestTimer();
  if (!timer.state) return null;
  const done = timer.remaining === 0;
  return (
    <aside
      className={`rest-timer ${done ? 'rest-done' : ''}`}
      aria-label="Temporizador de descanso"
    >
      <div className="timer-heading">
        <div>
          <span className="eyebrow">
            {done ? 'DESCANSO COMPLETADO' : 'RECUPERA EL AIRE'}
          </span>
          <p>{timer.state.exercise}</p>
        </div>
        <strong role="timer" aria-label="Tiempo restante">
          {formatTime(timer.remaining)}
        </strong>
      </div>
      <div className="timer-controls">
        <button
          className="timer-button"
          onClick={timer.state.pausedMs !== null ? timer.resume : timer.pause}
          aria-label={
            timer.state.pausedMs !== null
              ? 'Reanudar descanso'
              : 'Pausar descanso'
          }
        >
          {timer.state.pausedMs !== null ? (
            <Play size={17} />
          ) : (
            <Pause size={17} />
          )}
        </button>
        <button
          className="timer-button"
          onClick={timer.reset}
          aria-label="Reiniciar descanso"
        >
          <RotateCcw size={17} />
        </button>
        <button className="timer-button" onClick={timer.extend}>
          +30 s
        </button>
        <button className="timer-button skip" onClick={timer.stop}>
          {done ? 'Listo' : 'Saltar'}
          <X size={15} />
        </button>
      </div>
      {done && (
        <span className="sr-only" role="status">
          Descanso terminado. Puedes continuar.
        </span>
      )}
    </aside>
  );
}
