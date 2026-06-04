export class UIBus {
  constructor() {
    this.handlers = new Map();
  }

  on(eventName, handler) {
    const handlers = this.handlersFor(eventName);
    handlers.add(handler);

    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventName);
      }
    };
  }

  emit(eventName, payload) {
    const handlers = this.handlers.get(eventName);
    if (!handlers) {
      return;
    }

    for (const handler of handlers) {
      handler(payload);
    }
  }

  clear() {
    this.handlers.clear();
  }

  handlersFor(eventName) {
    const existing = this.handlers.get(eventName);
    if (existing) {
      return existing;
    }

    const handlers = new Set();
    this.handlers.set(eventName, handlers);
    return handlers;
  }
}
