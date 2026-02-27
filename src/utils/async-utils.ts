
/**
 * Maps over an array with a concurrency limit.
 *
 * @param items The array of items to map over.
 * @param mapper The async function to apply to each item.
 * @param concurrency The maximum number of concurrent promises.
 * @returns A promise that resolves to an array of results.
 */
export async function pMap<T, R>(
  items: T[],
  mapper: (item: T, index: number) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  if (concurrency < 1) {
    throw new Error('Concurrency must be at least 1');
  }

  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  const worker = async () => {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      const item = items[index];

      // No try-catch needed here if we just want to propagate the error immediately
      results[index] = await mapper(item, index);
    }
  };

  const workers = Array.from({ length: Math.min(items.length, concurrency) }, () => worker());

  await Promise.all(workers);
  return results;
}
