const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'toza_hudud_db'
});

async function migrate() {
  await client.connect();
  console.log('Connected to toza_hudud_db');

  try {
    // 1. Add Inspector and Driver to admins_role_enum
    await client.query(`ALTER TYPE admins_role_enum ADD VALUE IF NOT EXISTS 'Inspector';`);
    await client.query(`ALTER TYPE admins_role_enum ADD VALUE IF NOT EXISTS 'Driver';`);
    console.log('✅ admins_role_enum updated with Inspector and Driver');

    // 2. Add worker_id to admins table
    await client.query(`ALTER TABLE admins ADD COLUMN IF NOT EXISTS worker_id integer;`);
    console.log('✅ admins.worker_id column ensured');

    // 3. Add admin_id and role to workers table
    await client.query(`ALTER TABLE workers ADD COLUMN IF NOT EXISTS admin_id integer;`);
    await client.query(`ALTER TABLE workers ADD COLUMN IF NOT EXISTS role varchar(32) DEFAULT 'Driver';`);
    console.log('✅ workers.admin_id and workers.role columns ensured');

  } catch (err) {
    console.error('Migration error:', err);
    throw err;
  } finally {
    await client.end();
  }
}

migrate().catch(() => process.exit(1));
