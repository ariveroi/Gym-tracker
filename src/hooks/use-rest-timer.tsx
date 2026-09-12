'use client';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  startTimer,
  pauseTimer,
  resumeTimer,
  extendTimer,
  remainingMs,
  type TimerState,
} from '@/utils/timer';
interface TimerContextValue {
  state: TimerState | null;
  remaining: number;
  start: (seconds: number, exercise: string) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  extend: () => void;
  stop: () => void;
}
const ActionsContext = createContext<Pick<
  TimerContextValue,
  'start' | 'stop'
> | null>(null);
const Context = createContext<TimerContextValue | null>(null);
export function RestTimerProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string;
}) {
  const key = `gym:rest:${userId}`;
  const [state, setState] = useState<TimerState | null>(null);
  const [now, setNow] = useState(0);
  const notified = useRef(false);
  const persist = useCallback(
    (next: TimerState | null) => {
      setState(next);
      notified.current = false;
      try {
        if (next) localStorage.setItem(key, JSON.stringify(next));
        else localStorage.removeItem(key);
      } catch {
        /* El temporizador sigue funcionando en memoria. */
      }
    },
    [key],
  );
  const actions = useMemo(
    () => ({
      start: (seconds: number, exercise: string) => {
        setNow(Date.now());
        persist(startTimer(seconds, Date.now(), exercise));
      },
      stop: () => persist(null),
    }),
    [persist],
  );
  useEffect(() => {
    function restore() {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (
            typeof parsed.durationMs === 'number' &&
            typeof parsed.exercise === 'string' &&
            (typeof parsed.endTime === 'number' ||
              typeof parsed.pausedMs === 'number')
          )
            setState(parsed);
        } else setState(null);
      } catch {
        /* Ignorar almacenamiento no disponible. */
      }
      setNow(Date.now());
    }
    restore();
    const interval = setInterval(() => setNow(Date.now()), 250);
    const storage = (event: StorageEvent) => {
      if (event.key === key) restore();
    };
    window.addEventListener('storage', storage);
    document.addEventListener('visibilitychange', restore);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', storage);
      document.removeEventListener('visibilitychange', restore);
    };
  }, [key]);
  const remaining = state ? remainingMs(state, now) : 0;
  useEffect(() => {
    if (
      state &&
      state.pausedMs === null &&
      remaining === 0 &&
      !notified.current
    ) {
      notified.current = true;
      navigator.vibrate?.([150, 80, 150]);
    }
  }, [remaining, state]);
  const change = (fn: (s: TimerState, now: number) => TimerState) => {
    if (state) {
      setNow(Date.now());
      persist(fn(state, Date.now()));
    }
  };
  return (
    <ActionsContext.Provider value={actions}>
      <Context.Provider
        value={{
          state,
          remaining,
          start: actions.start,
          pause: () => change(pauseTimer),
          resume: () => change(resumeTimer),
          reset: () => {
            if (state)
              persist(
                startTimer(state.durationMs / 1000, Date.now(), state.exercise),
              );
          },
          extend: () => change(extendTimer),
          stop: actions.stop,
        }}
      >
        {children}
      </Context.Provider>
    </ActionsContext.Provider>
  );
}
export function useRestTimer() {
  const value = useContext(Context);
  if (!value) throw new Error('RestTimerProvider is required');
  return value;
}

export function useRestTimerActions() {
  const value = useContext(ActionsContext);
  if (!value) throw new Error('RestTimerProvider is required');
  return value;
}
