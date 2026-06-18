import { z } from "zod";
import { parseServerBaseUrl } from "@/lib/server-target";

const STORAGE_KEY = "farfield.server-profiles.v1";

const ServerProfileSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    baseUrl: z.string().min(1),
  })
  .strict();

const ServerProfilesSchema = z.array(ServerProfileSchema);

export type ServerProfile = z.infer<typeof ServerProfileSchema>;

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "server";
}

export function inferServerProfileName(baseUrl: string): string {
  try {
    const url = new URL(baseUrl);
    const host = url.hostname.replace(/\.tail[0-9a-z-]+\.ts\.net$/i, "");
    return host || url.hostname || "Server";
  } catch {
    return "Server";
  }
}

function makeProfileId(name: string, baseUrl: string): string {
  return `${slugify(name)}-${slugify(baseUrl)}`.slice(0, 96);
}

function parseStoredProfiles(raw: string): ServerProfile[] {
  const parsed = JSON.parse(raw);
  const result = ServerProfilesSchema.safeParse(parsed);
  return result.success ? result.data : [];
}

export function readServerProfiles(): ServerProfile[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    return parseStoredProfiles(raw);
  } catch {
    return [];
  }
}

function writeServerProfiles(profiles: ServerProfile[]): ServerProfile[] {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  }
  return profiles;
}

export function upsertServerProfile(input: {
  name: string;
  baseUrl: string;
}): ServerProfile[] {
  const name = input.name.trim() || inferServerProfileName(input.baseUrl);
  const baseUrl = parseServerBaseUrl(input.baseUrl);
  const current = readServerProfiles();
  const existingIndex = current.findIndex(
    (profile) => profile.baseUrl === baseUrl || profile.name === name,
  );
  const existing = existingIndex >= 0 ? current[existingIndex] : null;
  const nextProfile: ServerProfile = {
    id: existing?.id ?? makeProfileId(name, baseUrl),
    name,
    baseUrl,
  };
  const next =
    existingIndex >= 0
      ? current.map((profile, index) =>
          index === existingIndex ? nextProfile : profile,
        )
      : [...current, nextProfile];
  return writeServerProfiles(next);
}

export function removeServerProfile(profileId: string): ServerProfile[] {
  return writeServerProfiles(
    readServerProfiles().filter((profile) => profile.id !== profileId),
  );
}
