/* eslint-disable @typescript-eslint/class-methods-use-this */
import {
  ClientType,
  ErrorMessage,
  FrontendResponseMessage,
  IdentifyMessage,
  MessageType,
  WebkitMessage,
  WebSocketMessage,
} from '../extension/websocket/MessageTypes';
import { WebkitWrapper } from '../webkit';
import { handleWebkitMessage } from './MessageHandler';

/**
 * WebSocketServer handles communication with webkit clients
 */
export class WebSocketServer {
  private socket: WebSocket | null = null;
  private connectionPromise: Promise<WebSocket> | null = null;
  private webkitWrapper: WebkitWrapper | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 2000; // 2 seconds

  /**
   * Create a new WebSocketServer
   */
  constructor() {
    this.connect();
  }

  /**
   * Set the webkit wrapper to handle messages
   * @param webkitWrapper The webkit wrapper instance
   */
  public setWebkitWrapper(webkitWrapper: WebkitWrapper): void {
    this.webkitWrapper = webkitWrapper;
  }

  /**
   * Connect to the WebSocket server
   * @returns Promise resolving to the WebSocket connection
   */
  public async connect(): Promise<WebSocket> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return Promise.resolve(this.socket);
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise<WebSocket>((resolve, reject) => {
      try {
        this.socket = new WebSocket('ws://127.0.0.1:8765');

        this.socket.onopen = (): void => {
          // Identify as frontend client
          if (this.socket) {
            const message: IdentifyMessage = {
              type: MessageType.Identify,
              clientType: ClientType.Frontend,
            };

            this.socket.send(JSON.stringify(message));

            this.reconnectAttempts = 0;
            resolve(this.socket);
          } else {
            reject(new Error('Socket is null after connection'));
          }

          this.connectionPromise = null;
        };

        this.socket.onerror = (event): void => {
          console.error('WebSocket error:', event);
          this.socket = null;
          this.connectionPromise = null;
          reject(new Error('WebSocket connection error'));
          this.tryReconnect();
        };

        this.socket.onclose = (): void => {
          this.socket = null;
          this.connectionPromise = null;
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
        await this.connect();
      } catch {
        // Error is handled in connect
      }
    }, delay);
  }

  /**
   * Handle incoming WebSocket messages
   * @param event The message event
   */
  private async handleMessage(event: MessageEvent): Promise<void> {
    try {
      const data = JSON.parse(event.data as string) as WebSocketMessage;

      // Only handle messages from webkit clients
      if (this.isWebkitMessage(data) && this.webkitWrapper) {
        try {
          // Process the message
          const response = await handleWebkitMessage(data, this.webkitWrapper);

          // Send response back via WebSocket
          await this.sendFrontendResponse(data.requestId, data.extensionName, response);
        } catch (error) {
          console.error('Error processing webkit message:', error);

          // Send error response
          await this.sendErrorResponse(
            data.requestId,
            data.extensionName,
            error instanceof Error ? error.message : 'Unknown error',
          );
        }
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  private isWebkitMessage(message: WebSocketMessage): message is WebkitMessage {
    return message.type === MessageType.WebkitMessage && 'webkitRequestType' in message;
  }

  /**
   * Send a frontend response message
   * @param requestId The request ID
   * @param extensionName The extension name
   * @param content The response content
   */
  private async sendFrontendResponse(requestId: string, extensionName: string, content: unknown): Promise<void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      try {
        this.socket = await this.connect();
      } catch (error) {
        console.error('Failed to connect to send response:', error);

        return;
      }
    }

    const response: FrontendResponseMessage = {
      type: MessageType.FrontendResponse,
      requestId,
      extensionName,
      content,
    };

    this.socket.send(JSON.stringify(response));
  }

  /**
   * Send an error response message
   * @param requestId The request ID
   * @param extensionName The extension name
   * @param error The error message
   */
  private async sendErrorResponse(requestId: string, extensionName: string, error: string): Promise<void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      try {
        this.socket = await this.connect();
      } catch (err) {
        console.error('Failed to connect to send error:', err);

        return;
      }
    }

    const response: ErrorMessage = {
      type: MessageType.Error,
      requestId,
      extensionName,
      error,
      content: undefined,
    };

    this.socket.send(JSON.stringify(response));
  }
}
