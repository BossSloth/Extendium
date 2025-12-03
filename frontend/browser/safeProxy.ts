import { Logger } from '@extension/Logger';

// This allows chained access like chrome.test.other.something() to work without errors
function createNoopProxy(path: string[], logger: Logger): unknown {
  function noopFn(): unknown {
    const fullPath = path.join('.');
    logger.error('Chrome', `Chrome API function '${fullPath}()' does not exist.`);

    return undefined;
  }

  return new Proxy(noopFn, {
    get(_target, prop: string | symbol): unknown {
      if (typeof prop === 'symbol') {
        return undefined;
      }

      return createNoopProxy([...path, prop], logger);
    },
    apply(): unknown {
      const fullPath = path.join('.');
      logger.error('Chrome', `Chrome API function '${fullPath}()' does not exist.`);

      return undefined;
    },
  });
}

// Creates a recursive proxy that logs errors for undefined properties but never throws
// This allows chained access like chrome.test.other.something to work without errors
export function createSafeProxy(obj: object, logger: Logger, path: string[] = []): unknown {
  return new Proxy(obj, {
    get(target, prop: string | symbol): unknown {
      // Ignore symbol properties (like Symbol.toStringTag, Symbol.iterator, etc.)
      if (typeof prop === 'symbol') {
        return undefined;
      }

      if (prop in target) {
        const value = target[prop as keyof typeof target];

        // If the property is an object, wrap it in a safe proxy as well
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          return createSafeProxy(value, logger, [...path, prop]);
        }

        return value;
      }

      const fullPath = [...path, prop].join('.');
      logger.error('Chrome', `Chrome API property '${fullPath}' does not exist.`);

      // Return a no-op proxy that can be both accessed and called
      return createNoopProxy([...path, prop], logger);
    },
  });
}
