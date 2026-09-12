export interface TimerState {
  endTime: number | null;
  pausedMs: number | null;
  durationMs: number;
  exercise: string;
}
export const remainingMs = (state: TimerState, now: number) =>
  Math.max(0, state.pausedMs ?? (state.endTime ?? now) - now);
export const startTimer = (
  seconds: number,
  now: number,
  exercise: string,
): TimerState => ({
  endTime: now + seconds * 1000,
  pausedMs: null,
  durationMs: seconds * 1000,
  exercise,
});
export const pauseTimer = (state: TimerState, now: number): TimerState => ({
  ...state,
  pausedMs: remainingMs(state, now),
  endTime: null,
});
export const resumeTimer = (state: TimerState, now: number): TimerState => ({
  ...state,
  endTime: now + remainingMs(state, now),
  pausedMs: null,
});
export const extendTimer = (state: TimerState, now: number): TimerState =>
  state.pausedMs !== null
    ? { ...state, pausedMs: state.pausedMs + 30000 }
    : { ...state, endTime: now + remainingMs(state, now) + 30000 };
export function formatTime(ms: number) {
  const s = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(s / 60)
    .toString()
    .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}
