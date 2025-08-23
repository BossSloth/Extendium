/**
 * WebSocket client for communication between webkit and frontend
 */

import {
  ClientType,
  IdentifyMessage,
  MessageType,
  WebkitMessage,
  WebkitRequestType,
  WebSocketMessage,
} from '@extension/websocket/MessageTypes';

/**
 * Interface for pending request data
 */
interface PendingRequest {
  reject(reason: Error): void;
  resolve(value: unknown): void;
  timestamp: number;
}

/**
 * WebSocketClient handles communication between webkit and frontend
 */
export class WebSocketClient {
  private socket: WebSocket | null = null;
  private connectionPromise: Promise<WebSocket> | null = null;
  private readonly pendingRequests = new Map<string, PendingRequest>();
  private hasIdentified = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 2000; // 2 seconds
  private readonly requestTimeout = 30000; // 30 seconds

  constructor() {
    this.getConnection();
  }

  /**
   * Send a message to the frontend and wait for a response
   * @param message The message to send
   * @param requestType The type of request
   * @returns Promise resolving to the response
   */
  public async sendMessage(message: unknown, requestType: WebkitRequestType, extensionName: string): Promise<unknown> {
    // Clean up old requests first
    this.cleanupOldRequests();

    try {
      const ws = await this.getConnection();

      return await new Promise<unknown>((resolve, reject) => {
        const requestId = generateRequestId();

        // Store the request
        this.pendingRequests.set(requestId, {
          resolve,
          reject,
          timestamp: Date.now(),
        });

        // Create the message payload
        const payload: WebkitMessage = {
          type: MessageType.WebkitMessage,
          requestId,
          webkitRequestType: requestType,
          content: message,
          extensionName,
        };

        // Send the message
        ws.send(JSON.stringify(payload));

        // Set timeout for this specific request
        setTimeout(() => {
          if (this.pendingRequests.has(requestId)) {
            this.pendingRequests.delete(requestId);
            reject(new Error(`Request timed out for ${extensionName} - ${requestId}`));
            console.error('Request timed out', extensionName, requestId, message);
          }
        }, this.requestTimeout);
      });
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to send message');
    }
  }

  /**
   * Get or establish a WebSocket connection
   * @returns Promise resolving to a WebSocket connection
   */
  private async getConnection(): Promise<WebSocket> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return this.socket;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }
    const startMark = performance.mark('[Extendium] WebSocketClient getConnection start');

    this.connectionPromise = new Promise<WebSocket>((resolve, reject) => {
      try {
        this.socket = new WebSocket('ws://127.0.0.1:8791');

        this.socket.onopen = (): void => {
          this.reconnectAttempts = 0;

          if (this.socket) {
            // Send identification message
            this.identify();
            resolve(this.socket);
          } else {
            reject(new Error('Socket is null after connection'));
          }

          this.connectionPromise = null;
          const endMark = performance.mark('[Extendium] WebSocketClient getConnection end');
          performance.measure('[Extendium] WebSocketClient getConnection', startMark.name, endMark.name);
        };

        this.socket.onerror = (event: Event): void => {
          console.error('WebSocket error:', event);
          this.connectionPromise = null;
          this.socket = null;
          reject(new Error('WebSocket connection error'));
          this.tryReconnect();
        };

        this.socket.onclose = (): void => {
          this.socket = null;
          this.hasIdentified = false;
          this.connectionPromise = null;

          // Reject all pending requests
          this.rejectAllPendingRequests('WebSocket connection closed');

          this.tryReconnect();
        };

        this.socket.onmessage = this.handleMessage.bind(this);
      } catch (error) {
        this.connectionPromise = null;
        reject(error instanceof Error ? error : new Error('Unknown error when connecting to WebSocket'));
        this.tryReconnect();
      }
    });

    return this.connectionPromise;
  }

  /**
   * Identify this client to the server
   */
  private identify(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || this.hasIdentified) {
      return;
    }

    const message: IdentifyMessage = {
      type: MessageType.Identify,
      clientType: ClientType.Webkit,
    };

    this.socket.send(JSON.stringify(message));
    this.hasIdentified = true;
  }

  /**
   * Handle incoming WebSocket messages
   * @param event The message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const response = JSON.parse(event.data as string) as WebSocketMessage;
      const requestId = response.requestId;

      const request = this.pendingRequests.get(requestId);
      if (request) {
        this.pendingRequests.delete(requestId);

        // Use type assertion to handle the message type properly
        if (response.type === MessageType.Error) {
          request.reject(new Error(response.error ?? 'Unknown error'));
        } else if (response.type === MessageType.FrontendResponse) {
          request.resolve(response.content);
        }
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Try to reconnect to the WebSocket server
   */
  private tryReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Failed to reconnect after ${this.maxReconnectAttempts} attempts`);

      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * 1.5 ** (this.reconnectAttempts - 1);

    console.warn(`[Extendium] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(async () => {
      try {
        await this.getConnection();
      } catch {
        // Error is handled in getConnection
      }
    }, delay);
  }

  /**
   * Reject all pending requests with the given reason
   * @param reason The reason for rejection
   */
  private rejectAllPendingRequests(reason: string): void {
    this.pendingRequests.forEach((request) => {
      request.reject(new Error(reason));
    });
    this.pendingRequests.clear();
  }

  /**
   * Clean up old pending requests
   */
  private cleanupOldRequests(): void {
    const now = Date.now();
    const expiredRequestIds: string[] = [];

    this.pendingRequests.forEach((request, id) => {
      if (now - request.timestamp > this.requestTimeout) {
        expiredRequestIds.push(id);
      }
    });

    expiredRequestIds.forEach((id) => {
      const request = this.pendingRequests.get(id);
      if (request) {
        request.reject(new Error('Request timed out'));
        this.pendingRequests.delete(id);
      }
    });
  }
}

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
