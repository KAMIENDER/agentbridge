import { describe, expect, it } from "vitest";
import type { UnifiedThread } from "@agentbridge/unified-surface";
import { compactUnifiedThreadForPayload } from "../src/thread-payload";

function createThreadWithLargeOutputs(): UnifiedThread {
  const largeToolText = "x".repeat(200_000);
  const largeCommandOutput = "y".repeat(40_000);

  return {
    id: "thread-1",
    provider: "codex",
    turns: [
      {
        id: "turn-1",
        status: "completed",
        items: [
          {
            id: "tool-1",
            type: "mcpToolCall",
            server: "node_repl",
            tool: "js",
            status: "completed",
            arguments: {
              code: "console.log('ok')",
            },
            result: {
              content: [
                {
                  type: "text",
                  text: largeToolText,
                },
              ],
            },
          },
          {
            id: "command-1",
            type: "commandExecution",
            command: "printf output",
            status: "completed",
            aggregatedOutput: largeCommandOutput,
          },
          {
            id: "image-1",
            type: "imageGeneration",
            status: "completed",
            imageBase64: "a".repeat(200_000),
          },
        ],
      },
    ],
    requests: [],
    latestCollaborationMode: null,
    latestModel: null,
    latestReasoningEffort: null,
  };
}

describe("compactUnifiedThreadForPayload", () => {
  it("keeps full payloads unchanged", () => {
    const thread = createThreadWithLargeOutputs();

    expect(compactUnifiedThreadForPayload(thread, "full")).toBe(thread);
  });

  it("shrinks large historical payloads", () => {
    const thread = createThreadWithLargeOutputs();
    const compactThread = compactUnifiedThreadForPayload(thread, "compact");
    const originalBytes = JSON.stringify(thread).length;
    const compactBytes = JSON.stringify(compactThread).length;

    expect(compactBytes).toBeLessThan(originalBytes / 4);

    const firstItem = compactThread.turns[0]?.items[0];
    expect(firstItem?.type).toBe("mcpToolCall");
    if (firstItem?.type === "mcpToolCall") {
      expect(JSON.stringify(firstItem.result).length).toBeLessThan(1_000);
      expect(JSON.stringify(firstItem.result)).toContain("Large tool result");
    }

    const secondItem = compactThread.turns[0]?.items[1];
    expect(secondItem?.type).toBe("commandExecution");
    if (secondItem?.type === "commandExecution") {
      expect(secondItem.aggregatedOutput?.length).toBeLessThan(8_000);
      expect(secondItem.aggregatedOutput).toContain("Large command output");
    }

    const thirdItem = compactThread.turns[0]?.items[2];
    expect(thirdItem?.type).toBe("imageGeneration");
    if (thirdItem?.type === "imageGeneration") {
      expect(thirdItem.imageBase64).toBeNull();
    }
  });
});
