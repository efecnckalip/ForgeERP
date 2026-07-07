const PREFIX = "forgeerp";

const buildKey = (key) => `${PREFIX}:${key}`;

const storage = {
  get(key, defaultValue = []) {
    try {
      const value = localStorage.getItem(buildKey(key));

      if (!value) return defaultValue;

      return JSON.parse(value);
    } catch (error) {
      console.error(`Storage GET Error (${key})`, error);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(
        buildKey(key),
        JSON.stringify(value)
      );

      return true;
    } catch (error) {
      console.error(`Storage SET Error (${key})`, error);
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(buildKey(key));
  },

  clear() {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(`${PREFIX}:`))
      .forEach((key) => localStorage.removeItem(key));
  },

  exists(key) {
    return localStorage.getItem(buildKey(key)) !== null;
  },

  keys() {
    return Object.keys(localStorage)
      .filter((key) => key.startsWith(`${PREFIX}:`))
      .map((key) => key.replace(`${PREFIX}:`, ""));
  },
};

export default storage;