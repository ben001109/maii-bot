const cache = new Map();

export function get(key) {
  return cache.get(key);
}

export function set(key, value) {
  cache.set(key, value);
}

export function del(key) {
  cache.delete(key);
}

export function reset() {
  cache.clear();
}
