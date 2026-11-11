import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

/**
 * Banco do site: um único arquivo SQLite (`braza.db`) + pasta de fotos enviadas.
 * `DATA_DIR` aponta para fora da pasta do build (na VPS: /home/projetos/landingpagebraza/data),
 * para que um novo deploy não apague nada. Sem a variável, usa `./data` (desenvolvimento).
 */
// turbopackIgnore: o caminho é decidido em tempo de execução; não deve copiar o projeto inteiro para o build.
export const DATA_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR || path.join(process.cwd(), 'data'))
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads')

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS content (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS media (
    id         TEXT PRIMARY KEY,
    width      INTEGER NOT NULL,
    height     INTEGER NOT NULL,
    blur       TEXT,
    name       TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS rankings (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    period_label     TEXT NOT NULL,
    period_start     TEXT,
    period_end       TEXT,
    source_file_name TEXT,
    status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at     TEXT,
    created_at       TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS ranking_entries (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    ranking_id        INTEGER NOT NULL REFERENCES rankings(id) ON DELETE CASCADE,
    position          INTEGER NOT NULL CHECK (position > 0),
    customer_name     TEXT NOT NULL,
    phone_last_four   TEXT,
    order_count       INTEGER NOT NULL DEFAULT 0,
    original_position INTEGER,
    manually_edited   INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_entries_ranking ON ranking_entries(ranking_id);
`

function open() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  const db = new DatabaseSync(path.join(DATA_DIR, 'braza.db'))
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 4000;')
  db.exec(SCHEMA)
  return db
}

// Uma conexão por processo (o dev server recarrega módulos, então guardamos no globalThis).
const g = globalThis as unknown as { __brazaDb?: DatabaseSync }
export function db(): DatabaseSync {
  g.__brazaDb ??= open()
  return g.__brazaDb
}

export function getSetting(key: string): string | null {
  const row = db().prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function setSetting(key: string, value: string) {
  db().prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value)
}

/** Executa `fn` numa transação (tudo ou nada). */
export function tx<T>(fn: () => T): T {
  const d = db()
  d.exec('BEGIN')
  try {
    const out = fn()
    d.exec('COMMIT')
    return out
  } catch (err) {
    d.exec('ROLLBACK')
    throw err
  }
}
