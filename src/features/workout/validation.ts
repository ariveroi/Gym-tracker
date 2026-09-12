import { z } from 'zod';
export const setInput = z
  .object({
    id: z.uuid(),
    weight_kg: z.number().finite().min(0).max(1500).nullable(),
    reps: z.number().int().min(1).max(999).nullable(),
    duration_seconds: z.number().int().min(1).max(86400).nullable(),
    completed: z.boolean(),
  })
  .refine(
    (v) =>
      v.duration_seconds !== null
        ? v.weight_kg === null && v.reps === null
        : v.reps !== null && v.weight_kg !== null,
    { message: 'Registra peso y repeticiones, o una duración válida.' },
  );
