/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/no-unsafe-function-type */

// Because of some libraries like `chrome-promise`, we need to make all function on a class enumerable so it can loop through them.

export function enumerateMethods(instance: object): void {
  const proto = Object.getPrototypeOf(instance) as Record<string, unknown>;
  const methodNames = getAllMethodNames(instance);

  for (const name of methodNames) {
    // Only define it if it's not already enumerable on the instance
    if (!Object.hasOwn(instance, name)) {
      Object.defineProperty(instance, name, {
        value: (proto[name] as Function).bind(instance),
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
  }
}

function getAllMethodNames(obj: any): string[] {
  const methods = new Set<string>();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  let current = obj;

  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  while (current && current !== Object.prototype) {
    const props = Object.getOwnPropertyNames(current);

    for (const prop of props) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (typeof obj[prop] === 'function' && prop !== 'constructor') {
        methods.add(prop);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    current = Object.getPrototypeOf(current);
  }

  return Array.from(methods);
}

export function EnumerableMethods<T extends new(...args: any[]) => object>(constructor: T): T {
  return class extends constructor {
    constructor(...args: any[]) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      super(...args);
      enumerateMethods(this);
    }
  };
}
