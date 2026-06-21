import { z } from "zod";
import type { UnifiedThread, UnifiedTurn } from "@agentbridge/unified-surface";

const NonNegativeIntegerTextSchema = z
  .string()
  .regex(/^(0|[1-9]\d*)$/)
  .transform((value) => Number(value));

export const ThreadIncrementalReadQuerySchema = z
  .object({
    baseUpdatedAt: NonNegativeIntegerTextSchema,
    baseTurnCount: NonNegativeIntegerTextSchema,
    baseLastTurnId: z.string().min(1).max(4096).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.baseTurnCount > 0 && !value.baseLastTurnId) {
      context.addIssue({
        code: "custom",
        path: ["baseLastTurnId"],
        message: "baseLastTurnId is required when baseTurnCount is positive",
      });
    }
  });

export type ThreadIncrementalReadQuery = z.infer<
  typeof ThreadIncrementalReadQuerySchema
>;

export type IncrementalThreadReadResult =
  | {
      change: "unchanged";
      thread: UnifiedThread;
    }
  | {
      change: "patch";
      thread: UnifiedThread;
      appendTurns: UnifiedTurn[];
    }
  | {
      change: "resync";
      thread: UnifiedThread;
    };

export function stripThreadTurns(thread: UnifiedThread): UnifiedThread {
  return {
    ...thread,
    turns: [],
  };
}

function hasMatchingBaseTurn(
  currentThread: UnifiedThread,
  base: ThreadIncrementalReadQuery,
): boolean {
  if (base.baseTurnCount === 0) {
    return true;
  }

  const baseTurn = currentThread.turns[base.baseTurnCount - 1];
  if (!baseTurn) {
    return false;
  }

  return baseTurn.id === base.baseLastTurnId;
}

export function buildIncrementalThreadRead(input: {
  base: ThreadIncrementalReadQuery;
  currentThread: UnifiedThread;
}): IncrementalThreadReadResult {
  if (input.currentThread.updatedAt === input.base.baseUpdatedAt) {
    return {
      change: "unchanged",
      thread: stripThreadTurns(input.currentThread),
    };
  }

  if (!hasMatchingBaseTurn(input.currentThread, input.base)) {
    return {
      change: "resync",
      thread: input.currentThread,
    };
  }

  return {
    change: "patch",
    thread: stripThreadTurns(input.currentThread),
    appendTurns: input.currentThread.turns.slice(input.base.baseTurnCount),
  };
}
