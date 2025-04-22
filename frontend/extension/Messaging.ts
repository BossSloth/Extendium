/* eslint-disable max-classes-per-file */
import { Extension } from './Extension';

type Listener = (message: unknown, sender: chrome.runtime.MessageSender, sendResponse: SendResponse) => void | Promise<void> | boolean;

interface ListenerWithContext {
  context: string;
  listener: Listener;
}

type SendResponse = (response?: unknown) => void;

export class MessageEventEmulator {
  private listeners: ListenerWithContext[] = [];

  public addListener(context: string, listener: Listener): void {
    if (this.listeners.includes({ context, listener })) {
      console.warn('[Runtime] addListener: Listener already added.');

      return;
    }
    this.listeners.push({ context, listener });
  }

  public hasListeners(): boolean {
    return this.listeners.length > 0;
  }

  public hasListener(context: string, listener: Listener): boolean {
    return this.listeners.includes({ context, listener });
  }

  public removeListener(listener: Listener): void {
    this.listeners = this.listeners.filter(l => l.listener !== listener);
  }

  getListenersSnapshot(): readonly ListenerWithContext[] {
    return [...this.listeners];
  }
}

export class RuntimeEmulator {
  public readonly onMessage: MessageEventEmulator;

  constructor(readonly parent: Extension) {
    this.onMessage = new MessageEventEmulator();
  }

  async sendMessage(context: string, message: unknown, responseCallback?: (response?: unknown) => void): Promise<unknown> {
    const sender: chrome.runtime.MessageSender = {
      id: '12345',
      // TODO: figure out how to get the actual URL and id
      url: 'chrome-extension://12345/background.js',
    };
    const listeners = this.onMessage.getListenersSnapshot();

    let responseSent = false;
    let listenerReturnedTrue = false;

    // Create the promise that will resolve with the response
    const promise = new Promise<unknown>((resolve) => {
      // Function given to listeners to send a response back
      function sendResponse(response?: unknown): void {
        if (responseSent) {
          console.warn('[Runtime] sendResponse called more than once for the same message. Ignoring subsequent calls.');

          return;
        }
        responseSent = true;
        resolve(response); // Resolve the main promise
      }

      if (listeners.length === 0) {
        console.warn('[Runtime] sendMessage: No listeners found for message.', message);
        resolve(undefined); // No listeners, resolve promise immediately

        return;
      }

      // Iterate through all listeners
      for (const listener of listeners) {
        // Skip listeners that are in the same context
        if (listener.context === context) {
          continue;
        }
        try {
          // Call the listener
          // The 'returnValue' indicates if the listener intends to respond asynchronously.
          const returnValue = listener.listener(message, sender, sendResponse);

          if (returnValue === true) {
            // Listener intends to call sendResponse asynchronously.
            listenerReturnedTrue = true;
            // We don't resolve or break here; we wait for sendResponse to be called.
            // If multiple listeners return true, the *first* one to call sendResponse will resolve the promise.
          } else if (responseSent) {
            // If sendResponse was called *synchronously* within the listener
            // AND the listener did *not* return true, the promise is already resolving.
            // We can technically break here as Chrome often delivers to only one responder,
            // but let's continue iterating to mimic potential side effects in other listeners,
            // while ensuring only the first response is used via the `responseSent` flag.
            console.log('[Runtime] Response sent synchronously.');
          }
          // If listener returns void/undefined/false/etc., and didn't call sendResponse sync, do nothing immediately.
        } catch (error) {
          console.error('[Runtime] Error in message listener:', error);
          // Decide how to handle listener errors. Chrome usually just logs them.
          // We won't reject the promise here to mimic that behavior.
        }
      } // End listener loop

      // After iterating through all listeners:
      // If no response has been sent yet AND no listener indicated it would respond asynchronously,
      // then the channel closes, and the response is undefined.
      if (!responseSent && !listenerReturnedTrue) {
        resolve(undefined);
      }
      // Otherwise, the promise is either already resolving (sync sendResponse)
      // or waiting for an async sendResponse call.
    }); // End promise definition

    // Handle the optional legacy callback
    if (typeof responseCallback === 'function') {
      promise.then(responseCallback).catch((error: unknown) => {
        // Mimic runtime.lastError (though simplified)
        console.error('[Runtime] Error processing response for callback:', error);
        // In real Chrome, responseCallback might not be called, and runtime.lastError set.
        // For simplicity, we just log. You could pass an error object to the callback instead.
        try {
          responseCallback(undefined); // Call callback with undefined on error? Or pass error? Be consistent.
        } catch (cbError) {
          console.error('[Runtime] Error in responseCallback itself:', cbError);
        }
      });
    }

    // Always return the promise as per modern Chrome behavior
    return promise;
  }
}
