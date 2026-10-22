// Browser-side TMDB client. Every call goes through the worker (/api/tmdb), which holds the token.

export class HttpError extends Error {
  constructor(public status: number) {
    super(`Request failed with ${status}`);
  }
}

export type Params = Record<string, string | number | undefined>;

export async function getJson<T>(url: string, params: Params = {}, signal?: AbortSignal): Promise<T> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  const qs = query.toString();
  const res = await fetch(qs ? `${url}?${qs}` : url, { signal });
  if (!res.ok) throw new HttpError(res.status);
  return res.json() as Promise<T>;
}

export const tmdb = <T>(path: string, params?: Params, signal?: AbortSignal) =>
  getJson<T>(`/api/tmdb${path}`, params, signal);
