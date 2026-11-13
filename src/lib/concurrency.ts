/**
 * Runs `fn` over `items` with at most `limit` in flight at once, preserving
 * result order. Used to run theme-batch requests "3 at a time" per the spec,
 * instead of all-at-once (which could overwhelm the LLM provider) or fully
 * sequential (which would be needlessly slow).
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await fn(items[index], index);
    }
  }

  const workerCount = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return results;
}
