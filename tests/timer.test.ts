import { describe, it, expect } from 'vitest';
import {
  startTimer,
  remainingMs,
  pauseTimer,
  resumeTimer,
  extendTimer,
  formatTime,
} from '@/utils/timer';
describe('timestamp timer', () => {
  it('starts from a deadline', () =>
    expect(remainingMs(startTimer(120, 1000, 'Press'), 1000)).toBe(120000));
  it('catches up after sleep or a delayed tick', () =>
    expect(remainingMs(startTimer(120, 1000, 'Press'), 91000)).toBe(30000));
  it('never goes negative', () =>
    expect(remainingMs(startTimer(60, 0, 'Press'), 90000)).toBe(0));
  it('pauses without time drifting', () => {
    const state = pauseTimer(startTimer(120, 1000, 'Press'), 31000);
    expect(remainingMs(state, 1000000)).toBe(90000);
    expect(remainingMs(resumeTimer(state, 1000000), 1010000)).toBe(80000);
  });
  it('adds time while running, paused or finished', () => {
    const state = startTimer(120, 0, 'Press');
    expect(remainingMs(extendTimer(state, 10000), 10000)).toBe(140000);
    expect(
      remainingMs(extendTimer(pauseTimer(state, 10000), 20000), 20000),
    ).toBe(140000);
    expect(remainingMs(extendTimer(state, 999999), 999999)).toBe(30000);
  });
  it('survives serialization for reload', () => {
    const state = startTimer(120, 1000, 'Press');
    expect(remainingMs(JSON.parse(JSON.stringify(state)), 61000)).toBe(60000);
  });
  it('formats mm:ss rounding up', () => {
    expect(formatTime(61500)).toBe('01:02');
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(-100)).toBe('00:00');
  });
});
