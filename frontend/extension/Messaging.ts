import { ChromeEvent } from './ChromeEvent';
import { Extension } from './Extension';

type SendResponse = (response?: unknown) => void;

type Listener = (message: unknown, sender: chrome.runtime.MessageSender, sendResponse: SendResponse) => void | Promise<void> | boolean;

export class RuntimeEmulator {
  public readonly onMessage = new ChromeEvent<Listener>();

  private readonly timeout = 30000;

  constructor(readonly extension: Extension) {}

  async sendMessage(message: unknown, responseCallback?: (response?: unknown) => void): Promise<unknown> {
    const sender: chrome.runtime.MessageSender = {
      id: '12345',
      // TODO: figure out how to get the actual URL and id
      url: `chrome-extension://12345/${this.extension.manifest.background?.service_worker}`,
      tab: {
        id: 1,
        url: `chrome-extension://12345/${this.extension.manifest.background?.service_worker}`,
      },
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
        try {
          // Call the listener
          // The 'returnValue' indicates if the listener intends to respond asynchronously.
          const returnValue = listener(message, sender, sendResponse);

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
          this.extension.logger.error('Runtime', 'Error in message listener:', error);
          // Decide how to handle listener errors. Chrome usually just logs them.
          // We won't reject the promise here to mimic that behavior.
        }
      } // End listener loop

      // After iterating through all listeners:
      // If no response has been sent yet AND no listener indicated it would respond asynchronously,
      // then the channel closes, and the response is undefined.
      if (!responseSent && !listenerReturnedTrue) {
        resolve(undefined);
      } else {
        setTimeout(() => {
          if (!responseSent) {
            console.error('[Runtime] No response sent for message, Timed out:', message);
            resolve(undefined);
          }
        }, this.timeout);
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

export function parseRuntimeSendMessageArgs(argsUnknown: IArguments | unknown[]): SendMessageParsed {
  const args = Array.from(argsUnknown);
  const argsLength = args.length;

  function isCallback(x: unknown): x is (res?: unknown) => void {
    return typeof x === 'function';
  }
  // eslint-disable-next-line no-eq-null, eqeqeq
  const hasExtensionId = argsLength >= 2 && (typeof args[0] === 'string' || args[0] == null);

  if (hasExtensionId) {
    const extensionId = args[0] as string | null;
    const message = args[1];

    if (argsLength === 2) {
      // sendMessage(extensionId, message): Promise
      return { extensionId, message };
    }
    if (argsLength === 3) {
      // sendMessage(extensionId, message, responseCallback) OR sendMessage(extensionId, message, options)
      return isCallback(args[2])
        ? { extensionId, message, callback: args[2] }
        : { extensionId, message, options: args[2] as chrome.runtime.MessageOptions };
    }

    // argsLength >= 4: sendMessage(extensionId, message, options, responseCb)
    return {
      extensionId,
      message,
      options: args[2] as chrome.runtime.MessageOptions,
      callback: args[3] as (r?: unknown) => void,
    };
  }
  const message = args[0];
  if (argsLength === 1) {
    // sendMessage(message): Promise
    return { message };
  }
  if (argsLength === 2) {
    // sendMessage(message, responseCallback) OR sendMessage(message, options)
    return isCallback(args[1])
      ? { message, callback: args[1] as (r?: unknown) => void }
      : { message, options: args[1] as chrome.runtime.MessageOptions };
  }

  // argLength >= 3: sendMessage(message, options, responseCallback)
  return {
    message,
    options: args[1] as chrome.runtime.MessageOptions,
    callback: args[2] as (r?: unknown) => void,
  };
}

export interface SendMessageParsed {
  callback?(response?: unknown): void;
  extensionId?: string | null;
  message: unknown;
  options?: chrome.runtime.MessageOptions;
}
