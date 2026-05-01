/**
 * Run async tasks with bounded concurrency, preserving input order in the result array.
 * Used to upload many photos in parallel without overwhelming the network or Supabase.
 */
export async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<Array<{ ok: true; value: R } | { ok: false; error: Error }>> {
  const results: Array<{ ok: true; value: R } | { ok: false; error: Error }> = new Array(
    items.length
  );
  let cursor = 0;

  async function next() {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      try {
        const value = await worker(items[i], i);
        results[i] = { ok: true, value };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        results[i] = { ok: false, error };
      }
    }
  }

  const workers = Array.from({ length: Math.max(1, Math.min(concurrency, items.length)) }, next);
  await Promise.all(workers);
  return results;
}
