import "@testing-library/jest-dom";

// Polyfill localStorage when jsdom doesn't provide a full Storage implementation
if (typeof localStorage === "undefined" || typeof localStorage.clear !== "function") {
  const storage: Record<string, string> = {};
  Object.defineProperty(global, "localStorage", {
    value: {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = String(value);
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        Object.keys(storage).forEach((k) => delete storage[k]);
      },
      get length() {
        return Object.keys(storage).length;
      },
      key: (index: number) => Object.keys(storage)[index] ?? null,
    },
    writable: true,
    configurable: true,
  });
}
