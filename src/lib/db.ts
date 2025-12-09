import { createClient, Client } from '@libsql/client';

type ClientType = Client;

declare global {
  // eslint-disable-next-line no-var
  var __tursoClient: ClientType | undefined;
}

const url = process.env.TURSO_DATABASE_URL ?? 'file:./database/local.db';
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

export async function query<T = unknown>(sql: string, args: (string | number | null)[] = []) {
  const result = await client.execute({
    sql,
    args
  });
  return { rows: result.rows as unknown as T[] };
}

export async function execMany(sql: string) {
  return client.executeMultiple(sql);
}

export function getClient() {
  return client;
}
