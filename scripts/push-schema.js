const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@libsql/client');

const url = process.env.TURSO_DATABASE_URL ?? 'file:./database/local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

async function main() {
  const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  const client = createClient({ url, authToken });
  await client.executeMultiple(schema);
  console.log('✅ Skema berhasil dipush ke', url);
}

main().catch((err) => {
  console.error('Gagal push skema', err);
  process.exit(1);
});
