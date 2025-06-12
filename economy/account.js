const accounts = new Map();

export function getBalance(id) {
  return accounts.get(id) ?? 0;
}

export function deposit(id, amount) {
  if (amount <= 0) return getBalance(id);
  accounts.set(id, getBalance(id) + amount);
  return getBalance(id);
}

export function withdraw(id, amount) {
  const balance = getBalance(id);
  if (amount > balance) {
    throw new Error('Insufficient funds');
  }
  accounts.set(id, balance - amount);
  return getBalance(id);
}

export function reset(id) {
  if (id) {
    accounts.delete(id);
  } else {
    accounts.clear();
  }
}
