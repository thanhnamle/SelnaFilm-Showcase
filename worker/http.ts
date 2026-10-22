/** GET a JSON API; any failure (network, timeout, non-2xx, bad JSON) is null. */
export async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { accept: 'application/json', 'user-agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    return await res.json<T>();
  } catch {
    return null;
  }
}
