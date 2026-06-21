import { z } from "zod";
import { UnifiedThreadSchema } from "@agentbridge/unified-surface";
import type { ReadThreadResponse } from "./api";
import { parseServerBaseUrl } from "./server-target";

const THREAD_CACHE_NAME = "agentbridge-thread-cache-v1";
const CACHE_RECORD_VERSION = 1;

const CachedReadThreadResponseSchema = z
  .object({
    thread: UnifiedThreadSchema,
    turnWindow: z
      .object({
        start: z.number().int().nonnegative(),
        count: z.number().int().nonnegative(),
        total: z.number().int().nonnegative(),
      })
      .strict()
      .optional(),
  })
  .strict();

const ThreadCacheRecordSchema = z
  .object({
    version: z.literal(CACHE_RECORD_VERSION),
    serverBaseUrl: z.string(),
    threadId: z.string(),
    updatedAt: z.number(),
    cachedAt: z.number(),
    response: CachedReadThreadResponseSchema,
  })
  .strict();
const ThreadUpdatedAtSchema = z.number();

interface ThreadCacheInput {
  serverBaseUrl: string;
  threadId: string;
  updatedAt: number;
}

interface StoreThreadCacheInput {
  serverBaseUrl: string;
  response: ReadThreadResponse;
}

export interface CachedThreadSnapshot {
  updatedAt: number;
  response: ReadThreadResponse;
}

function buildThreadCacheRequest(input: {
  serverBaseUrl: string;
  threadId: string;
}): Request {
  const normalizedBaseUrl = parseServerBaseUrl(input.serverBaseUrl);
  const url = new URL("/__agentbridge_thread_cache__", location.origin);
  url.searchParams.set("server", normalizedBaseUrl);
  url.searchParams.set("thread", input.threadId);
  return new Request(url.toString());
}

async function openThreadCache(): Promise<Cache> {
  return window.caches.open(THREAD_CACHE_NAME);
}

export async function readCachedThread(
  input: ThreadCacheInput,
): Promise<ReadThreadResponse | null> {
  try {
    const cache = await openThreadCache();
    const cached = await cache.match(buildThreadCacheRequest(input));
    if (!cached) {
      return null;
    }

    const parsed = ThreadCacheRecordSchema.safeParse(await cached.json());
    if (!parsed.success) {
      return null;
    }

    if (
      parsed.data.serverBaseUrl !== parseServerBaseUrl(input.serverBaseUrl) ||
      parsed.data.threadId !== input.threadId ||
      parsed.data.updatedAt !== input.updatedAt
    ) {
      return null;
    }

    return parsed.data.response;
  } catch {
    return null;
  }
}

export async function readCachedThreadSnapshot(input: {
  serverBaseUrl: string;
  threadId: string;
}): Promise<CachedThreadSnapshot | null> {
  try {
    const cache = await openThreadCache();
    const cached = await cache.match(buildThreadCacheRequest(input));
    if (!cached) {
      return null;
    }

    const parsed = ThreadCacheRecordSchema.safeParse(await cached.json());
    if (!parsed.success) {
      return null;
    }

    if (
      parsed.data.serverBaseUrl !== parseServerBaseUrl(input.serverBaseUrl) ||
      parsed.data.threadId !== input.threadId
    ) {
      return null;
    }

    return {
      updatedAt: parsed.data.updatedAt,
      response: parsed.data.response,
    };
  } catch {
    return null;
  }
}

export async function writeCachedThread(
  input: StoreThreadCacheInput,
): Promise<void> {
  const updatedAtResult = ThreadUpdatedAtSchema.safeParse(
    input.response.thread.updatedAt,
  );
  if (!updatedAtResult.success) {
    return;
  }

  try {
    const serverBaseUrl = parseServerBaseUrl(input.serverBaseUrl);
    const record = ThreadCacheRecordSchema.parse({
      version: CACHE_RECORD_VERSION,
      serverBaseUrl,
      threadId: input.response.thread.id,
      updatedAt: updatedAtResult.data,
      cachedAt: Date.now(),
      response: input.response,
    });
    const cache = await openThreadCache();
    await cache.put(
      buildThreadCacheRequest({
        serverBaseUrl,
        threadId: input.response.thread.id,
      }),
      new Response(JSON.stringify(record), {
        headers: {
          "content-type": "application/json",
        },
      }),
    );
  } catch {
    return;
  }
}
