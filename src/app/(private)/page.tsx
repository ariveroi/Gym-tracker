import { requireUser } from '@/features/auth/service';
import {
  getActiveSession,
  listSessions,
  previousPerformances,
} from '@/features/workout/repository';
import { workoutDays } from '@/config/routine';
import { getNextWorkoutDay } from '@/utils/workout';
import { WorkoutScreen } from '@/features/workout/workout-screen';
export default async function Today() {
  const { client } = await requireUser();
  const [active, history] = await Promise.all([
    getActiveSession(client),
    listSessions(client, 0, 1),
  ]);
  const day =
    active?.routine_snapshot ?? workoutDays[getNextWorkoutDay(history)];
  const previous = await previousPerformances(
    client,
    day.exercises.map((e) => e.id),
  );
  return (
    <WorkoutScreen
      key={active?.id ?? day.id}
      day={day}
      initial={active}
      previous={previous}
    />
  );
}
