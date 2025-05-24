/**
 * Types of messages that can be sent over the WebSocket
 */
export enum MessageType {
  Identify = 'identify',
  WebkitMessage = 'webkit_message',
  FrontendResponse = 'frontend_response',
  Error = 'error',
}

export enum WebkitRequestType {
  SendMessage = 'sendMessage',
  // #region Storage
  GetStorage = 'getStorage',
  SetStorage = 'setStorage',
  RemoveStorage = 'removeStorage',
  ClearStorage = 'clearStorage',
  // #endregion
  OpenOptions = 'openOptions',
}

/**
 * Types of clients that can connect to the WebSocket server
 */
export enum ClientType {
  Frontend = 'frontend',
  Webkit = 'webkit',
}

/**
 * Generic message interface for all WebSocket messages
 */
export interface WebSocketMessage {
  content: unknown;
  error?: string;
  extensionName: string;
  requestId: string;
  type: MessageType;
}

/**
 * Message sent by clients to identify themselves
 */
export interface IdentifyMessage {
  clientType: ClientType;
  type: MessageType.Identify;
}

/**
 * Message sent from webkit to frontend
 */
export interface WebkitMessage extends WebSocketMessage {
  type: MessageType.WebkitMessage;
  webkitRequestType: WebkitRequestType; // NOTE: if you change this name make sure to change it in the WebSocketServer.ts file as well
}

/**
 * Response message sent from frontend to webkit
 */
export interface FrontendResponseMessage extends WebSocketMessage {
  type: MessageType.FrontendResponse;
}

/**
 * Error message sent when something goes wrong
 */
export interface ErrorMessage extends WebSocketMessage {
  error: string;
  type: MessageType.Error;
}

// #region WebkitRequestTypes content

export interface StorageGetSetContent {
  area: chrome.storage.AreaName;
  keys: Record<string, unknown>;
}

export interface StorageRemoveContent {
  area: chrome.storage.AreaName;
  keys: string | string[];
}

export interface StorageClearContent {
  area: chrome.storage.AreaName;
}

// #endregion
