import { describe, expect, it } from "vitest";
import type { UnifiedThread } from "@agentbridge/unified-surface";
import {
  ThreadIncrementalReadQuerySchema,
  buildIncrementalThreadRead,
} from "../src/thread-incremental";

function createThread(input: {
  updatedAt: number;
  turnIds: string[];
}): UnifiedThread {
  return {
    id: "thread-1",
    provider: "codex",
    turns: input.turnIds.map((turnId) => ({
      id: turnId,
      status: "completed",
      items: [],
    })),
    requests: [],
    updatedAt: input.updatedAt,
    latestCollaborationMode: null,
    latestModel: null,
    latestReasoningEffort: null,
  };
}

describe("buildIncrementalThreadRead", () => {
  it("returns unchanged when updatedAt matches the base", () => {
    const thread = createThread({
      updatedAt: 10,
      turnIds: ["turn-1", "turn-2"],
    });
    const result = buildIncrementalThreadRead({
      base: {
        baseUpdatedAt: 10,
        baseTurnCount: 2,
        baseLastTurnId: "turn-2",
      },
      currentThread: thread,
    });

    expect(result.change).toBe("unchanged");
    expect(result.thread.turns).toHaveLength(0);
  });

  it("returns appended turns when the base is still a prefix", () => {
    const thread = createThread({
      updatedAt: 12,
      turnIds: ["turn-1", "turn-2", "turn-3"],
    });
    const result = buildIncrementalThreadRead({
      base: {
        baseUpdatedAt: 10,
        baseTurnCount: 2,
        baseLastTurnId: "turn-2",
      },
      currentThread: thread,
    });

    expect(result.change).toBe("patch");
    if (result.change === "patch") {
      expect(result.thread.turns).toHaveLength(0);
      expect(result.appendTurns.map((turn) => turn.id)).toEqual(["turn-3"]);
    }
  });

  it("returns resync when the base turn no longer matches", () => {
    const thread = createThread({
      updatedAt: 12,
      turnIds: ["turn-1", "turn-4"],
    });
    const result = buildIncrementalThreadRead({
      base: {
        baseUpdatedAt: 10,
        baseTurnCount: 2,
        baseLastTurnId: "turn-2",
      },
      currentThread: thread,
    });

    expect(result.change).toBe("resync");
    expect(result.thread.turns.map((turn) => turn.id)).toEqual([
      "turn-1",
      "turn-4",
    ]);
  });
});

describe("ThreadIncrementalReadQuerySchema", () => {
  it("requires last turn id for non-empty bases", () => {
    const result = ThreadIncrementalReadQuerySchema.safeParse({
      baseUpdatedAt: "10",
      baseTurnCount: "2",
    });

    expect(result.success).toBe(false);
  });
});
