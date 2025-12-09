const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@libsql/client');

const url = process.env.TURSO_DATABASE_URL ?? 'file:./database/local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

async function main() {
  const seedPath = path.join(process.cwd(), 'database', 'seed.sql');
  const seed = fs.readFileSync(seedPath, 'utf8');

  const client = createClient({ url, authToken });
  await client.executeMultiple(seed);
  console.log('✅ Data seed berhasil dimasukkan ke', url);
}

main().catch((err) => {
  console.error('Gagal menjalankan seed', err);
  process.exit(1);
});
