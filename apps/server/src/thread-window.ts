import { z } from "zod";
import type { UnifiedThread } from "@agentbridge/unified-surface";

export const DEFAULT_THREAD_TURN_WINDOW_LIMIT = 24;

const NonNegativeIntegerTextSchema = z
  .string()
  .regex(/^(0|[1-9]\d*)$/)
  .transform((value) => Number(value));

const PositiveIntegerTextSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform((value) => Number(value));

export const ThreadTurnWindowQuerySchema = z
  .object({
    turnStart: NonNegativeIntegerTextSchema.optional(),
    turnLimit: PositiveIntegerTextSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.turnStart !== undefined && value.turnLimit === undefined) {
      context.addIssue({
        code: "custom",
        path: ["turnLimit"],
        message: "turnLimit is required when turnStart is provided",
      });
    }
  });

export type ThreadTurnWindowQuery = z.infer<
  typeof ThreadTurnWindowQuerySchema
>;

export const ThreadTurnWindowSchema = z
  .object({
    start: z.number().int().nonnegative(),
    count: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  })
  .strict();

export type ThreadTurnWindow = z.infer<typeof ThreadTurnWindowSchema>;

export interface WindowedThreadResult {
  thread: UnifiedThread;
  turnWindow: ThreadTurnWindow | null;
}

export function applyThreadTurnWindow(input: {
  thread: UnifiedThread;
  query: ThreadTurnWindowQuery;
}): WindowedThreadResult {
  if (input.query.turnLimit === undefined) {
    return {
      thread: input.thread,
      turnWindow: null,
    };
  }

  const total = input.thread.turns.length;
  const requestedStart =
    input.query.turnStart ??
    Math.max(0, total - input.query.turnLimit);
  const start = Math.min(requestedStart, total);
  const end = Math.min(total, start + input.query.turnLimit);
  const turns = input.thread.turns.slice(start, end);

  return {
    thread: {
      ...input.thread,
      turns,
    },
    turnWindow: ThreadTurnWindowSchema.parse({
      start,
      count: turns.length,
      total,
    }),
  };
}
