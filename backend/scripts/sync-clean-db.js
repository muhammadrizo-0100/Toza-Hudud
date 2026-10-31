const { Client } = require('pg');

async function sync() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/toza_hudud_db'
  });

  await client.connect();
  console.log('Connected to PostgreSQL...');

  await client.query('BEGIN');
  await client.query('DELETE FROM requests');
  await client.query('DELETE FROM workers');

  await client.query(`
    INSERT INTO requests (
      id, district_id, mahalla_id, mahalla_name, source,
      citizen_telegram_id, citizen_full_name, before_photo_url,
      lat, lng, status, waste_type, created_at, updated_at
    ) VALUES (
      1, 10, 84, 'Mashad MFY', 'telegram',
      '5920494855', 'Muhammadrizo', '/uploads/tg-1793259859851-260139565.jpg',
      41.0312580, 71.8668940, 'new', 'maishiy', '2026-10-29 07:52:25.278983+00', '2026-10-29 07:52:25.278983+00'
    )
  `);

  await client.query("SELECT setval('requests_id_seq', (SELECT MAX(id) FROM requests))");
  await client.query('COMMIT');

  const res = await client.query('SELECT id, citizen_full_name, mahalla_name, status, created_at FROM requests');
  console.log('SUCCESS! Real requests in DB:', res.rows);

  await client.end();
}

sync().catch(err => {
  console.error('Error during sync:', err);
  process.exit(1);
});
