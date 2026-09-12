import type { SessionWithSets } from '@/types/workout';
import { calculateVolume, estimated1RM } from '@/utils/workout';
export function progressPoints(history: SessionWithSets[]) {
  return [...history].reverse().map((session) => {
    const sets = session.exercise_sets.filter((s) => s.completed_at);
    return {
      id: session.id,
      date: session.completed_at!,
      maxWeight: Math.max(0, ...sets.map((s) => s.weight_kg ?? 0)),
      volume: calculateVolume(sets),
      oneRM: Math.max(
        0,
        ...sets.map((s) => estimated1RM(s.weight_kg ?? 0, s.reps ?? 0)),
      ),
      seconds: Math.max(0, ...sets.map((s) => s.duration_seconds ?? 0)),
    };
  });
}
