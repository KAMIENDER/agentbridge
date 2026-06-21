import { Buffer } from "node:buffer";
import { z } from "zod";
import type {
  UnifiedItem,
  UnifiedThread,
  UnifiedTurn,
} from "@agentbridge/unified-surface";

export const UnifiedThreadPayloadModeSchema = z.enum(["full", "compact"]);
export type UnifiedThreadPayloadMode = z.infer<
  typeof UnifiedThreadPayloadModeSchema
>;

const LARGE_JSON_VALUE_BYTES = 64 * 1024;
const LARGE_TEXT_CHARS = 16 * 1024;
const TEXT_PREVIEW_CHARS = 4 * 1024;

type McpToolCallItem = Extract<UnifiedItem, { type: "mcpToolCall" }>;
type DynamicToolCallItem = Extract<UnifiedItem, { type: "dynamicToolCall" }>;
type CommandExecutionItem = Extract<UnifiedItem, { type: "commandExecution" }>;
type FileChangeItem = Extract<UnifiedItem, { type: "fileChange" }>;
type ImageGenerationItem = Extract<UnifiedItem, { type: "imageGeneration" }>;

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.ceil(bytes / 1024).toString()} KB`;
}

function compactNotice(kind: string, bytes: number): string {
  return `Large ${kind} omitted from compact thread payload (${formatBytes(bytes)}).`;
}

function compactText(value: string, kind: string): string {
  if (value.length <= LARGE_TEXT_CHARS) {
    return value;
  }
  return `${value.slice(0, TEXT_PREVIEW_CHARS)}\n\n${compactNotice(kind, Buffer.byteLength(value, "utf8"))}`;
}

function compactMcpToolCallItem(item: McpToolCallItem): McpToolCallItem {
  if (item.result === undefined || item.result === null) {
    return item;
  }

  const resultBytes = Buffer.byteLength(JSON.stringify(item.result), "utf8");
  if (resultBytes <= LARGE_JSON_VALUE_BYTES) {
    return item;
  }

  return {
    ...item,
    result: {
      content: [
        {
          type: "text",
          text: compactNotice("tool result", resultBytes),
        },
      ],
      ...(item.result.structuredContent !== undefined
        ? { structuredContent: null }
        : {}),
    },
  };
}

function compactDynamicToolCallItem(
  item: DynamicToolCallItem,
): DynamicToolCallItem {
  if (item.contentItems === undefined || item.contentItems === null) {
    return item;
  }

  const contentBytes = Buffer.byteLength(
    JSON.stringify(item.contentItems),
    "utf8",
  );
  if (contentBytes <= LARGE_JSON_VALUE_BYTES) {
    return item;
  }

  return {
    ...item,
    contentItems: [
      {
        type: "inputText",
        text: compactNotice("tool output", contentBytes),
      },
    ],
  };
}

function compactCommandExecutionItem(
  item: CommandExecutionItem,
): CommandExecutionItem {
  if (item.aggregatedOutput === undefined || item.aggregatedOutput === null) {
    return item;
  }
  return {
    ...item,
    aggregatedOutput: compactText(item.aggregatedOutput, "command output"),
  };
}

function compactFileChangeItem(item: FileChangeItem): FileChangeItem {
  return {
    ...item,
    changes: item.changes.map((change) => ({
      ...change,
      ...(change.diff !== undefined
        ? { diff: compactText(change.diff, "file diff") }
        : {}),
    })),
  };
}

function compactImageGenerationItem(
  item: ImageGenerationItem,
): ImageGenerationItem {
  if (
    item.imageBase64 === undefined ||
    item.imageBase64 === null ||
    item.imageBase64.length <= LARGE_TEXT_CHARS
  ) {
    return item;
  }
  return {
    ...item,
    imageBase64: null,
  };
}

function compactUnifiedItem(item: UnifiedItem): UnifiedItem {
  switch (item.type) {
    case "mcpToolCall":
      return compactMcpToolCallItem(item);
    case "dynamicToolCall":
      return compactDynamicToolCallItem(item);
    case "commandExecution":
      return compactCommandExecutionItem(item);
    case "fileChange":
      return compactFileChangeItem(item);
    case "imageGeneration":
      return compactImageGenerationItem(item);
    default:
      return item;
  }
}

function compactUnifiedTurn(turn: UnifiedTurn): UnifiedTurn {
  return {
    ...turn,
    items: turn.items.map(compactUnifiedItem),
  };
}

export function compactUnifiedThreadForPayload(
  thread: UnifiedThread,
  mode: UnifiedThreadPayloadMode,
): UnifiedThread {
  if (mode === "full") {
    return thread;
  }

  return {
    ...thread,
    turns: thread.turns.map(compactUnifiedTurn),
  };
}
