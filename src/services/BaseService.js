import storage from "./storage";

export default class BaseService {
  constructor(storageKey) {
    this.storageKey = storageKey;
  }

  getAll() {
    return storage.get(this.storageKey, []);
  }

  getById(id) {
    return this.getAll().find((item) => item.id === id);
  }

  create(data) {
    const items = this.getAll();

    const item = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    items.unshift(item);

    storage.set(this.storageKey, items);

    return item;
  }

  update(id, data) {
    const items = this.getAll();

    const updated = items.map((item) =>
      item.id === id
        ? {
            ...item,
            ...data,
            updatedAt: new Date().toISOString(),
          }
        : item
    );

    storage.set(this.storageKey, updated);

    return updated.find((item) => item.id === id);
  }

  delete(id) {
    const items = this.getAll().filter((item) => item.id !== id);

    storage.set(this.storageKey, items);
  }

  search(keyword) {
    if (!keyword) return this.getAll();

    const text = keyword.toLowerCase();

    return this.getAll().filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(text)
      )
    );
  }

  count() {
    return this.getAll().length;
  }

  exists(id) {
    return !!this.getById(id);
  }

  save(items) {
    storage.set(this.storageKey, items);
  }
}