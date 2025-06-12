const players = new Map();

export function getPlayer(id) {
  return players.get(id);
}

export function createPlayer(id, balance = 0) {
  if (players.has(id)) return false;
  players.set(id, balance);
  return true;
}

export function updatePlayer(id, balance) {
  players.set(id, balance);
}

export function deletePlayer(id) {
  players.delete(id);
}

export function reset() {
  players.clear();
}
