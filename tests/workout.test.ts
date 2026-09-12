import { describe, it, expect } from 'vitest';
import {
  getNextWorkoutDay,
  calculateVolume,
  estimated1RM,
  summarizeSession,
} from '@/utils/workout';
import { workoutDays, allExercises } from '@/config/routine';
import { setInput } from '@/features/workout/validation';
import type { ExerciseSet } from '@/types/workout';
const completed = (day: 'day-1' | 'day-2', date = '2026-09-01T12:00:00Z') => ({
  workout_day_id: day,
  status: 'completed' as const,
  completed_at: date,
});
describe('getNextWorkoutDay', () => {
  it('starts at Día 1', () => expect(getNextWorkoutDay([])).toBe('day-1'));
  it('advances to Día 2', () =>
    expect(getNextWorkoutDay([completed('day-1')])).toBe('day-2'));
  it('cycles to Día 1', () =>
    expect(getNextWorkoutDay([completed('day-2')])).toBe('day-1'));
  it('ignores unfinished sessions', () =>
    expect(
      getNextWorkoutDay([
        completed('day-1'),
        { workout_day_id: 'day-2', status: 'active', completed_at: null },
      ]),
    ).toBe('day-2'));
  it('does not advance with only an active session', () =>
    expect(
      getNextWorkoutDay([
        { workout_day_id: 'day-1', status: 'active', completed_at: null },
      ]),
    ).toBe('day-1'));
  it('uses last completion even if unsorted and long ago', () =>
    expect(
      getNextWorkoutDay([
        completed('day-1', '2025-01-02'),
        completed('day-2', '2025-01-01'),
      ]),
    ).toBe('day-2'));
  it('ignores completed status without a timestamp', () =>
    expect(
      getNextWorkoutDay([
        { workout_day_id: 'day-1', status: 'completed', completed_at: null },
      ]),
    ).toBe('day-1'));
});
describe('strength calculations', () => {
  it('uses Epley', () => expect(estimated1RM(60, 10)).toBe(80));
  it('supports decimal weights', () =>
    expect(estimated1RM(22.5, 8)).toBeCloseTo(28.5));
  it.each([
    [0, 10],
    [-10, 5],
    [30, 0],
    [NaN, 3],
    [10, Infinity],
  ])('ignores invalid values %s %s', (weight, reps) =>
    expect(estimated1RM(weight, reps)).toBe(0),
  );
  it('sums only completed weighted sets', () =>
    expect(
      calculateVolume([
        { weight_kg: 70, reps: 10, completed_at: '2026-01-01' },
        { weight_kg: 67.5, reps: 9, completed_at: '2026-01-01' },
        { weight_kg: 100, reps: 10, completed_at: null },
        { weight_kg: null, reps: null, completed_at: '2026-01-01' },
      ]),
    ).toBe(1307.5));
  it('handles empty sessions', () => expect(calculateVolume([])).toBe(0));
  it('summarizes only performed exercises', () => {
    const result = summarizeSession({
      started_at: '2026-01-01T12:00:00Z',
      completed_at: '2026-01-01T12:45:00Z',
      exercise_sets: [
        {
          exercise_id: 'a',
          weight_kg: 10,
          reps: 10,
          completed_at: '2026-01-01',
        },
        { exercise_id: 'b', weight_kg: null, reps: null, completed_at: null },
      ] as ExerciseSet[],
    });
    expect(result).toEqual({ minutes: 45, exercises: 1, sets: 1, volume: 100 });
  });
});
describe('routine and validation', () => {
  it('has stable unique exercise ids and correct set totals', () => {
    expect(new Set(allExercises.map((e) => e.id)).size).toBe(13);
    expect(workoutDays['day-1'].exercises.reduce((n, e) => n + e.sets, 0)).toBe(
      15,
    );
    expect(workoutDays['day-2'].exercises.reduce((n, e) => n + e.sets, 0)).toBe(
      17,
    );
  });
  const base = { id: 'aab21860-bf43-4bd7-b8bb-ef7c031fb433', completed: true };
  it('accepts decimal weights and bodyweight zero', () => {
    for (const weight of [0, 22.5])
      expect(
        setInput.safeParse({
          ...base,
          weight_kg: weight,
          reps: 8,
          duration_seconds: null,
        }).success,
      ).toBe(true);
  });
  it('rejects mixed units', () =>
    expect(
      setInput.safeParse({
        ...base,
        weight_kg: 20,
        reps: 8,
        duration_seconds: 30,
      }).success,
    ).toBe(false));
  it('rejects missing or negative values', () => {
    for (const reps of [null, 0, -1, 3.5])
      expect(
        setInput.safeParse({
          ...base,
          weight_kg: 20,
          reps,
          duration_seconds: null,
        }).success,
      ).toBe(false);
  });
  it('accepts timed sets', () =>
    expect(
      setInput.safeParse({
        ...base,
        weight_kg: null,
        reps: null,
        duration_seconds: 30,
      }).success,
    ).toBe(true));
});
