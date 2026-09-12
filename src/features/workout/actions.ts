'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/features/auth/service';
import * as repository from './repository';
import { workoutDays } from '@/config/routine';
import { getNextWorkoutDay } from '@/utils/workout';
import { setInput } from './validation';
import type {
  ActionResult,
  ExerciseSet,
  SessionWithSets,
} from '@/types/workout';
export async function beginWorkout(): Promise<ActionResult<SessionWithSets>> {
  const { client } = await requireUser();
  try {
    const active = await repository.getActiveSession(client);
    if (active) return { data: active };
    const history = await repository.listSessions(client, 0, 1);
    return {
      data: await repository.startSession(
        client,
        workoutDays[getNextWorkoutDay(history)],
      ),
    };
  } catch {
    return {
      error: 'No se pudo iniciar. Reintenta para recuperar o crear tu sesión.',
    };
  }
}
export async function saveWorkoutSet(
  input: unknown,
): Promise<ActionResult<ExerciseSet>> {
  const { client } = await requireUser();
  const parsed = setInput.safeParse(input);
  if (!parsed.success)
    return {
      error:
        'Revisa los valores: peso entre 0 y 1.500 kg y repeticiones o segundos positivos.',
    };
  try {
    const { id, completed, ...values } = parsed.data;
    return { data: await repository.updateSet(client, id, values, completed) };
  } catch {
    return {
      error:
        'No se guardó la serie. Mantuvimos tus datos: vuelve a pulsar el botón para reintentar.',
    };
  }
}
export async function addWorkoutSet(
  sessionId: string,
  exerciseId: string,
): Promise<ActionResult<ExerciseSet>> {
  const { client } = await requireUser();
  if (!z.uuid().safeParse(sessionId).success)
    return { error: 'Sesión no válida.' };
  try {
    return { data: await repository.addSet(client, sessionId, exerciseId) };
  } catch {
    return { error: 'No se pudo añadir la serie. Reinténtalo.' };
  }
}
export async function removeWorkoutSet(
  id: string,
): Promise<ActionResult<string>> {
  const { client } = await requireUser();
  if (!z.uuid().safeParse(id).success) return { error: 'Serie no válida.' };
  try {
    return { data: await repository.removeSet(client, id) };
  } catch {
    return {
      error:
        'No se pudo eliminar. Solo puedes quitar la última serie adicional.',
    };
  }
}
export async function completeWorkout(
  id: string,
): Promise<ActionResult<SessionWithSets>> {
  const { client } = await requireUser();
  if (!z.uuid().safeParse(id).success) return { error: 'Sesión no válida.' };
  try {
    const session = await repository.finishSession(client, id);
    revalidatePath('/', 'layout');
    return { data: session };
  } catch {
    return {
      error:
        'No se pudo finalizar. Comprueba que hay alguna serie completada e inténtalo de nuevo.',
    };
  }
}
