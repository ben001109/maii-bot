import * as cache from '../storage/redis.js';
import * as db from '../storage/postgres.js';

const accounts = new Map();

export function getBalance(id) {
  if (accounts.has(id)) return accounts.get(id);
  const cached = cache.get(id);
  if (cached !== undefined) {
    accounts.set(id, cached);
    return cached;
  }
  const value = db.getPlayer(id) ?? 0;
  accounts.set(id, value);
  cache.set(id, value);
  return value;
const accounts = new Map();

export function getBalance(id) {
  return accounts.get(id) ?? 0;
}

export function deposit(id, amount) {
  if (amount <= 0) return getBalance(id);
  const newBalance = getBalance(id) + amount;
  accounts.set(id, newBalance);
  cache.set(id, newBalance);
  db.updatePlayer(id, newBalance);
  return newBalance;
  accounts.set(id, getBalance(id) + amount);
  return getBalance(id);
}

export function withdraw(id, amount) {
  const balance = getBalance(id);
  if (amount > balance) {
    throw new Error('Insufficient funds');
  }
  const newBalance = balance - amount;
  accounts.set(id, newBalance);
  cache.set(id, newBalance);
  db.updatePlayer(id, newBalance);
  return newBalance;
}

export function initAccount(id) {
  const created = db.createPlayer(id, 0);
  if (created) {
    accounts.set(id, 0);
    cache.set(id, 0);
  }
  return created;
  accounts.set(id, balance - amount);
  return getBalance(id);
}

export function reset(id) {
  if (id) {
    accounts.delete(id);
    cache.del(id);
    db.deletePlayer(id);
  } else {
    accounts.clear();
    cache.reset();
    db.reset();
  } else {
    accounts.clear();
  }
}
