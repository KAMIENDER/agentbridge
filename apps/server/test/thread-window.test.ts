import { describe, expect, it } from "vitest";
import type { UnifiedThread } from "@agentbridge/unified-surface";
import { applyThreadTurnWindow } from "../src/thread-window";

function createThread(turnCount: number): UnifiedThread {
  return {
    id: "thread-1",
    provider: "codex",
    turns: Array.from({ length: turnCount }, (_, index) => ({
      id: `turn-${index + 1}`,
      status: "completed",
      items: [],
    })),
    requests: [],
    latestCollaborationMode: null,
    latestModel: null,
    latestReasoningEffort: null,
  };
}

describe("applyThreadTurnWindow", () => {
  it("keeps full turns when no window is requested", () => {
    const result = applyThreadTurnWindow({
      thread: createThread(4),
      query: {},
    });

    expect(result.turnWindow).toBeNull();
    expect(result.thread.turns.map((turn) => turn.id)).toEqual([
      "turn-1",
      "turn-2",
      "turn-3",
      "turn-4",
    ]);
  });

  it("returns the latest turns when only a limit is requested", () => {
    const result = applyThreadTurnWindow({
      thread: createThread(5),
      query: {
        turnLimit: 2,
      },
    });

    expect(result.turnWindow).toEqual({
      start: 3,
      count: 2,
      total: 5,
    });
    expect(result.thread.turns.map((turn) => turn.id)).toEqual([
      "turn-4",
      "turn-5",
    ]);
  });

  it("returns a requested older range", () => {
    const result = applyThreadTurnWindow({
      thread: createThread(5),
      query: {
        turnStart: 1,
        turnLimit: 2,
      },
    });

    expect(result.turnWindow).toEqual({
      start: 1,
      count: 2,
      total: 5,
    });
    expect(result.thread.turns.map((turn) => turn.id)).toEqual([
      "turn-2",
      "turn-3",
    ]);
  });
});
