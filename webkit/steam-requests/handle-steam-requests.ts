import { steamRequestIDKey, steamRequestInfoKey, steamRequestUrlKey } from '../extension/requests/crossRequestKeys';
import { base64Encode } from '../extension/utils';
import { SteamRequestResponseContent, WebkitRequestType } from '../extension/websocket/MessageTypes';
import { webSocketClient } from '../shared';

export async function handleSteamRequests(): Promise<void> {
  const query = new URLSearchParams(window.location.search);

  const steamRequestID = query.get(steamRequestIDKey);
  const steamRequestUrl = query.get(steamRequestUrlKey);
  const steamRequestInfo = query.get(steamRequestInfoKey);
  if (steamRequestID === null || steamRequestUrl === null || steamRequestInfo === null) {
    return;
  }

  const requestInfo = JSON.parse(steamRequestInfo) as RequestInit;

  const response = await fetch(steamRequestUrl, requestInfo);

  const responseText = await response.text();

  const message: SteamRequestResponseContent = {
    requestId: steamRequestID,
    response: base64Encode(responseText),
    status: response.status,
    url: response.url,
  };

  const startTime = performance.now();

  await webSocketClient.sendMessage(message, WebkitRequestType.SteamRequestResponse, '');

  console.log(`Steam Request ${steamRequestID} took ${performance.now() - startTime}ms`);

  window.close();
}
