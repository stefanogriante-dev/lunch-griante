-- Tabella assenze: si registrano SOLO le assenze, default = presente
CREATE TABLE IF NOT EXISTS absences (
  id        bigserial PRIMARY KEY,
  person    text      NOT NULL,
  date      date      NOT NULL,
  meal      text      NOT NULL CHECK (meal IN ('pranzo', 'cena')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (person, date, meal)
);

-- RLS: disabilitato (accesso solo server-side con service_role key)
ALTER TABLE absences DISABLE ROW LEVEL SECURITY;
