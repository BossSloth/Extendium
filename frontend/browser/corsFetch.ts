import { steamRequestIDKey, steamRequestInfoKey, steamRequestUrlKey } from '../extension/requests/crossRequestKeys';
import { base64Decode } from '../extension/utils';
import { SteamRequestResponseContent } from '../extension/websocket/MessageTypes';
import { mainWindow } from '../shared';

/* eslint-disable @typescript-eslint/no-base-to-string */
const corsCacheKey = 'extendium-cors-cache';
const proxyUrl = 'http://127.0.0.1:8792/proxy/';

const pendingRequests = new Map<string, PendingRequest>();

interface PendingRequest {
  reject(reason: Error): void;
  resolve(value: Response): void;
}

export function patchFetch(window: Window): void {
  const oldFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const baseUrl = input.toString()
      .replace('https://', '')
      .replace('http://', '')
      .split('/')[0] ?? 'error';

    if ((init?.credentials === 'include' && (baseUrl.includes('steampowered.com') || baseUrl.includes('steamcommunity.com'))) || (baseUrl === 'store.steampowered.com' && input.toString().includes('user'))) {
      return credentialsFetch(input, init);
    }

    const corsCache = JSON.parse(localStorage.getItem(corsCacheKey) ?? '[]') as string[];

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

async function credentialsFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  console.log(`Fetching ${input.toString()} with credentials`);

  const requestId = generateRequestId();
  const query = new URLSearchParams();
  query.set(steamRequestIDKey, requestId);
  query.set(steamRequestUrlKey, input.toString());
  query.set(steamRequestInfoKey, JSON.stringify(init));

  const url = `${getCredentialsUrl(input.toString())}/?${query.toString()}`;

  SteamClient.BrowserView.Create({ parentPopupBrowserID: mainWindow.SteamClient.Browser.GetBrowserID(), strInitialURL: url });

  return new Promise<Response>((resolve, reject) => {
    pendingRequests.set(requestId, {
      resolve,
      reject,
    });

    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        reject(new Error(`Steam Request timed out for ${requestId}`));
      }
    }, 10000);
  });
}

// We use a page that has the smallest size so it loads the quickest
function getCredentialsUrl(inputUrl: string): string {
  if (inputUrl.startsWith('https://store.steampowered.com')) {
    return 'https://store.steampowered.com/widget';
  }

  if (inputUrl.startsWith('https://steamcommunity.com')) {
    return 'https://steamcommunity.com/stats';
  }

  return new URL(inputUrl).origin;
}

export function resolvePendingRequest(responseContent: SteamRequestResponseContent): void {
  const pendingRequest = pendingRequests.get(responseContent.requestId);

  if (!pendingRequest) {
    return;
  }

  pendingRequests.delete(responseContent.requestId);

  const response = new Response(base64Decode(responseContent.response), { status: responseContent.status });
  Object.defineProperty(response, 'url', { value: responseContent.url });

  pendingRequest.resolve(response);
}

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
