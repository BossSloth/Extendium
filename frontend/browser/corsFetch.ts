/* eslint-disable @typescript-eslint/no-base-to-string */
const corsCacheKey = 'extendium-cors-cache';
const proxyUrl = 'http://localhost:8766/proxy/';

export function patchFetch(window: Window): void {
  const oldFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const corsCache = JSON.parse(localStorage.getItem(corsCacheKey) ?? '[]') as string[];

    const baseUrl = input.toString()
      .replace('https://', '')
      .replace('http://', '')
      .split('/')[0] ?? 'error';

    if (corsCache.includes(baseUrl)) {
      return corsFetch(oldFetch, input, init);
    }

    try {
      const response = await oldFetch(input, init);

      return response;
    } catch {
      // Likely CORS error, refetch with backend
      const corsResponse = await corsFetch(oldFetch, input, init);

      if (corsResponse.ok) {
        corsCache.push(baseUrl);
        localStorage.setItem(corsCacheKey, JSON.stringify(corsCache));
      }

      return corsResponse;
    }
  };
}

async function corsFetch(oldFetch: typeof window.fetch, input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const requestUrl = input.toString().replace('https://', '').replace('http://', '');
  const response = await oldFetch(proxyUrl + requestUrl, init);

  return response;
}
