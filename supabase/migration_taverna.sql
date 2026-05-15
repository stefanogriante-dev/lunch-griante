-- Taverna: si registrano le PRESENZE (default = non usa)
CREATE TABLE IF NOT EXISTS taverna (
  id         bigserial PRIMARY KEY,
  person     text      NOT NULL,
  date       date      NOT NULL,
  slot       text      NOT NULL CHECK (slot IN ('mattino', 'pomeriggio', 'sera')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (person, date, slot)
);

ALTER TABLE taverna DISABLE ROW LEVEL SECURITY;
