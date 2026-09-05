/** Bound each HTTP request; never automatically retry a state-changing POST. */
export const timedFetch: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const parent = init?.signal ?? (input instanceof Request ? input.signal : undefined);
  const abort = () => controller.abort();
  if (parent?.aborted) abort();
  else parent?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, 15000);
  try { return await fetch(input, { ...init, signal: controller.signal }); }
  finally {
    clearTimeout(timer);
    parent?.removeEventListener('abort', abort);
  }
};
