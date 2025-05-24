class GameTickManager {
  constructor() {
    this.ticks = new Map();
  }

  addTick(id, callback, interval) {
    if (this.ticks.has(id)) {
      throw new Error(`Tick with id ${id} already exists.`);
    }
    const tick = setInterval(callback, interval);
    this.ticks.set(id, tick);
  }

  removeTick(id) {
    if (!this.ticks.has(id)) {
      throw new Error(`Tick with id ${id} does not exist.`);
    }
    clearInterval(this.ticks.get(id));
    this.ticks.delete(id);
  }

  clearAllTicks() {
    for (const tick of this.ticks.values()) {
      clearInterval(tick);
    }
    this.ticks.clear();
  }
}

module.exports = new GameTickManager();
