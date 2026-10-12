/** Deterministic pseudo-random generator so re-seeded data is reproducible. */
export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function emailFromName(name: string, domain = "emeraldheightacademy.com"): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(".");
  return `${cleaned}@${domain}`;
}
