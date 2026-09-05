CREATE TABLE machines (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('washer', 'dryer')),
  status TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'in_use')),
  in_use_since TEXT,
  qr_token TEXT NOT NULL UNIQUE,
  CHECK (
    (status = 'free' AND in_use_since IS NULL)
    OR status = 'in_use'
  )
);

CREATE TABLE machine_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  machine_id TEXT NOT NULL,
  status_change TEXT NOT NULL CHECK (status_change IN ('free', 'in_use')),
  timestamp TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

CREATE INDEX idx_machines_type_status ON machines(type, status);
CREATE INDEX idx_machine_history_machine_timestamp
  ON machine_history(machine_id, timestamp DESC);
