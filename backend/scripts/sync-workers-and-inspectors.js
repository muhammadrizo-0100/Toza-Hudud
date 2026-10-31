const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'toza_hudud_db'
};

const INSPECTORS = [
  { districtCode: 'namangan_shahar', fullName: 'Qo‘chqorov Temurbek Odilovich', phone: '+998901235101', username: 'inspector_namangan_shahar' },
  { districtCode: 'davlatobod', fullName: 'Eshmatov Tohirjon Ilhomovich', phone: '+998901235102', username: 'inspector_davlatobod' },
  { districtCode: 'yangi_namangan', fullName: 'Mirzahakimov Jamoliddin Baxtiyorovich', phone: '+998901235103', username: 'inspector_yangi_namangan' },
  { districtCode: 'chust', fullName: 'G‘ulomov Alisher Sobirovich', phone: '+998901235104', username: 'inspector_chust' },
  { districtCode: 'kosonsoy', fullName: 'Rahmonov Shavkatbek Tohirovich', phone: '+998901235105', username: 'inspector_kosonsoy' },
  { districtCode: 'chortoq', fullName: 'Ergashev Boburjon Erkinovich', phone: '+998901235106', username: 'inspector_chortoq' },
  { districtCode: 'pop', fullName: 'Usmonov Xurshid Shavkatovich', phone: '+998901235107', username: 'inspector_pop' },
  { districtCode: 'toraqorgon', fullName: 'Yoqubov Dilshodbek Ilhomovich', phone: '+998901235108', username: 'inspector_toraqorgon' },
  { districtCode: 'uchqorgon', fullName: 'Nurmatov Sanjarbek Qobilovich', phone: '+998901235109', username: 'inspector_uchqorgon' },
  { districtCode: 'uychi', fullName: 'Mamatqulov Anvarjon Botirovich', phone: '+998901235110', username: 'inspector_uychi' },
  { districtCode: 'mingbuloq', fullName: 'Sattorov Elyorbek Farruxovich', phone: '+998901235111', username: 'inspector_mingbuloq' },
  { districtCode: 'norin', fullName: 'Vohidov Sardorbek Ulug‘bekovich', phone: '+998901235112', username: 'inspector_norin' },
  { districtCode: 'yangiqorgon', fullName: 'Azimov Otabek Oybekovich', phone: '+998901235113', username: 'inspector_yangiqorgon' },
  { districtCode: 'namangan_tuman', fullName: 'Hamidov Jahongir Doniyorovich', phone: '+998901235114', username: 'inspector_namangan_tuman' }
];

async function sync() {
  const client = new Client(dbConfig);
  await client.connect();
  console.log('✅ PostgreSQL ulandi');

  try {
    await client.query('BEGIN');

    // 1. Add/Update Inspectors in workers table
    for (const insp of INSPECTORS) {
      const distRes = await client.query('SELECT id, name FROM districts WHERE code = $1', [insp.districtCode]);
      if (distRes.rows.length === 0) continue;
      const districtId = distRes.rows[0].id;

      // Check worker
      let workerId;
      const workerCheck = await client.query('SELECT id FROM workers WHERE phone = $1', [insp.phone]);
      if (workerCheck.rows.length > 0) {
        workerId = workerCheck.rows[0].id;
        await client.query(
          `UPDATE workers SET full_name = $1, role = 'Inspector', district_id = $2, is_active = true, updated_at = NOW() WHERE id = $3`,
          [insp.fullName, districtId, workerId]
        );
      } else {
        const ins = await client.query(
          `INSERT INTO workers (district_id, full_name, phone, role, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, 'Inspector', true, NOW(), NOW()) RETURNING id`,
          [districtId, insp.fullName, insp.phone]
        );
        workerId = ins.rows[0].id;
      }

      // Create Admin account for Inspector
      const pwdHash = await bcrypt.hash('Inspector2026!', 10);
      const adminCheck = await client.query('SELECT id FROM admins WHERE username = $1', [insp.username]);
      let adminId;
      if (adminCheck.rows.length > 0) {
        adminId = adminCheck.rows[0].id;
        await client.query(
          `UPDATE admins 
           SET password_hash = $1, full_name = $2, phone = $3, job_title = 'Hudud nazoratchisi / Uchastka ustasi',
               role = 'Inspector', district_id = $4, worker_id = $5, is_active = true, updated_at = NOW()
           WHERE id = $6`,
          [pwdHash, insp.fullName, insp.phone, districtId, workerId, adminId]
        );
      } else {
        const adminIns = await client.query(
          `INSERT INTO admins (username, password_hash, full_name, phone, job_title, role, district_id, worker_id, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'Hudud nazoratchisi / Uchastka ustasi', 'Inspector', $5, $6, true, NOW(), NOW())
           RETURNING id`,
          [insp.username, pwdHash, insp.fullName, insp.phone, districtId, workerId]
        );
        adminId = adminIns.rows[0].id;
      }

      // Link back to worker
      await client.query('UPDATE workers SET admin_id = $1 WHERE id = $2', [adminId, workerId]);
      console.log(`✅ Inspector: ${insp.fullName} (${insp.districtCode}) -> login: ${insp.username}`);
    }

    // 2. Create Admin accounts for all Drivers in workers table
    const drivers = await client.query(`SELECT w.id, w.full_name, w.phone, w.district_id, d.code as dist_code 
      FROM workers w 
      JOIN districts d ON w.district_id = d.id 
      WHERE w.role = 'Driver' OR w.role IS NULL`);

    for (let i = 0; i < drivers.rows.length; i++) {
      const dr = drivers.rows[i];
      // Index per district
      const username = `driver${(i % 2) + 1}_${dr.dist_code}`;
      const pwdHash = await bcrypt.hash('Driver2026!', 10);

      const adminCheck = await client.query('SELECT id FROM admins WHERE username = $1', [username]);
      let adminId;
      if (adminCheck.rows.length > 0) {
        adminId = adminCheck.rows[0].id;
        await client.query(
          `UPDATE admins 
           SET password_hash = $1, full_name = $2, phone = $3, job_title = 'Maxsus texnika haydovchisi',
               role = 'Driver', district_id = $4, worker_id = $5, is_active = true, updated_at = NOW()
           WHERE id = $6`,
          [pwdHash, dr.full_name, dr.phone, dr.district_id, dr.id, adminId]
        );
      } else {
        const adminIns = await client.query(
          `INSERT INTO admins (username, password_hash, full_name, phone, job_title, role, district_id, worker_id, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'Maxsus texnika haydovchisi', 'Driver', $5, $6, true, NOW(), NOW())
           RETURNING id`,
          [username, pwdHash, dr.full_name, dr.phone, dr.district_id, dr.id]
        );
        adminId = adminIns.rows[0].id;
      }

      await client.query(`UPDATE workers SET admin_id = $1, role = 'Driver' WHERE id = $2`, [adminId, dr.id]);
      console.log(`✅ Driver: ${dr.full_name} -> login: ${username}`);
    }

    await client.query('COMMIT');
    console.log('\n🎉 Barcha nazoratchilar va haydovchilar hisoblari muvaffaqiyatli sinxronlashtirildi!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Xatolik:', err);
    throw err;
  } finally {
    await client.end();
  }
}

sync().catch(() => process.exit(1));
