import { createClient, Client } from '@libsql/client';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { readFile } from 'fs/promises';
import { dirname, resolve } from 'path';

type ClientType = Client;

declare global {
  // eslint-disable-next-line no-var
  var __tursoClient: ClientType | undefined;
}

const defaultDbPath = process.env.VERCEL || process.env.NODE_ENV === 'production'
  ? resolve('/tmp', 'kasiresto-local.db')
  : resolve(process.cwd(), 'database/local.db');

if (!process.env.TURSO_DATABASE_URL) {
  const dbDir = dirname(defaultDbPath);
  mkdirSync(dbDir, { recursive: true });

  if (!existsSync(defaultDbPath)) {
    writeFileSync(defaultDbPath, '');
  }
}

const url = process.env.TURSO_DATABASE_URL ?? `file:${defaultDbPath}`;
const authToken = process.env.TURSO_AUTH_TOKEN;

const client: ClientType =
  global.__tursoClient ??
  createClient({
    url,
    authToken
  });

if (!global.__tursoClient) {
  global.__tursoClient = client;
}

let initPromise: Promise<void> | null = null;

async function ensureInitialized() {
  if (initPromise) return initPromise;

  if (!url.startsWith('file:')) {
    initPromise = Promise.resolve();
    return initPromise;
  }

  initPromise = (async () => {
    const tableCheck = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    );

    if (tableCheck.rows.length) return;

    const schemaSql = await readFile(resolve(process.cwd(), 'database/schema.sql'), 'utf8');
    await client.executeMultiple(schemaSql);

    const seedSql = await readFile(resolve(process.cwd(), 'database/seed.sql'), 'utf8');
    await client.executeMultiple(seedSql);
  })();

  return initPromise;
}

export async function query<T = unknown>(sql: string, args: (string | number | null)[] = []) {
  await ensureInitialized();

  const result = await client.execute({
    sql,
    args
  });
  return { rows: result.rows as unknown as T[] };
}

export async function execMany(sql: string) {
  await ensureInitialized();

  return client.executeMultiple(sql);
}

export function getClient() {
  return client;
}
