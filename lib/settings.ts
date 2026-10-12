import "server-only";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Simple in-memory cache so settings aren't re-read on every request.
 * No TTL — `setSetting` deletes the key on write; call `clearSettingsCache`
 * after external DB writes if needed. (Date.now() is banned at prerender.)
 */
const cache = new Map<string, unknown>();

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  if (cache.has(key)) {
    return cache.get(key) as T;
  }
  try {
    const row = await db.query.settings.findFirst({ where: eq(settings.key, key) });
    const value = (row?.value ?? fallback) as T;
    cache.set(key, value);
    return value;
  } catch {
    return fallback;
  }
}

export async function setSetting(
  key: string,
  value: unknown,
  updatedBy?: string | null,
): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value, updatedBy: updatedBy ?? null })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedBy: updatedBy ?? null, updatedAt: new Date() },
    });
  cache.delete(key);
}

export function clearSettingsCache(): void {
  cache.clear();
}
