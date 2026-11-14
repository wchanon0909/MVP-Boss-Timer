-- One shared timer per (boss, map). Edits overwrite the latest observed Tomb time.
CREATE TABLE IF NOT EXISTS boss_timers (
  boss_id INTEGER NOT NULL,
  map_id TEXT NOT NULL,
  tomb_at TEXT NOT NULL,
  spawn_at TEXT NOT NULL,
  editor TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (boss_id, map_id)
);
CREATE INDEX IF NOT EXISTS idx_boss_timers_spawn_at ON boss_timers (spawn_at);
