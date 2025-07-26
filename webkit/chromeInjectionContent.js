const chrome = extensions.get(extensionName)?.chrome;

const windowProxy = new Proxy(window, {
  get(target, prop, receiver) {
    if (prop === "chrome") {
      return chrome;
    }

    const value = Reflect.get(target, prop, receiver);

    // If it's a function and from window, bind it
    if (typeof value === "function" && target.hasOwnProperty(prop)) {
      return value.bind(target);
    }

    return value;
  },
  has(target, prop) {
    if (prop === "chrome") return true;
    return Reflect.has(target, prop);
  }
});