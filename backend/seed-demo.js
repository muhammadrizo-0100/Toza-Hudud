const { Client } = require('pg');
require('dotenv').config();

async function seed() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'toza_hudud_db'
  });

  await client.connect();
  console.log('Connected to PostgreSQL database for demo seeding...');

  // Check if requests already exist
  const resReq = await client.query('SELECT COUNT(*) FROM requests');
  if (parseInt(resReq.rows[0].count, 10) > 0) {
    console.log(`Already have ${resReq.rows[0].count} requests in DB, skipping seed.`);
    await client.end();
    return;
  }

  // Insert workers
  const worker1 = await client.query(`
    INSERT INTO workers (district_id, full_name, phone, vehicle_number, is_active, created_at, updated_at)
    VALUES (1, 'Alisher Qodirov', '+998901112233', '50 123 AAA', true, NOW(), NOW())
    RETURNING id;
  `);
  const worker1Id = worker1.rows[0].id;

  const worker2 = await client.query(`
    INSERT INTO workers (district_id, full_name, phone, vehicle_number, is_active, created_at, updated_at)
    VALUES (1, 'Botir Temirov', '+998904445566', '50 789 BBB', true, NOW(), NOW())
    RETURNING id;
  `);
  const worker2Id = worker2.rows[0].id;
  console.log(`Created workers: ${worker1Id}, ${worker2Id}`);

  const trashPhoto = 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80';
  const cleanPhoto = 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80';

  const demoRequests = [
    {
      districtId: 1,
      mahallaId: 1,
      mahallaName: 'Yuksalish MFY',
      source: 'telegram',
      citizenPhone: '+998912345678',
      citizenFullName: 'Anvar Karimov',
      beforePhotoUrl: trashPhoto,
      afterPhotoUrl: null,
      lat: 41.0112,
      lng: 71.5721,
      address: 'Yuksalish ko‘chasi, 24-uy ro‘parasi',
      description: 'Chiqindi qutilari to‘lib ketgan, 3 kundan beri olinmagan',
      status: 'new',
      assignedWorkerId: null,
      assignedAt: null,
      submittedAt: null,
      completedAt: null
    },
    {
      districtId: 1,
      mahallaId: 2,
      mahallaName: 'Navbahor MFY',
      source: 'web_portal',
      citizenPhone: '+998935557788',
      citizenFullName: 'Dilnoza Salimova',
      beforePhotoUrl: trashPhoto,
      afterPhotoUrl: null,
      lat: 41.0150,
      lng: 71.5800,
      address: 'Navbahor 3-tor ko‘chasi, bolalar maydonchasi yaqini',
      description: 'Qurilish chiqindilari to‘planib qolgan',
      status: 'new',
      assignedWorkerId: null,
      assignedAt: null,
      submittedAt: null,
      completedAt: null
    },
    {
      districtId: 1,
      mahallaId: 3,
      mahallaName: 'Orzu MFY',
      source: 'telegram',
      citizenPhone: '+998909876543',
      citizenFullName: 'Jahongir Olimov',
      beforePhotoUrl: trashPhoto,
      afterPhotoUrl: null,
      lat: 41.0080,
      lng: 71.5650,
      address: 'Orzu massivi, 14-uy orqasi',
      description: 'Ahlat mashinasi o‘z vaqtida kelmadi',
      status: 'in_progress',
      assignedWorkerId: worker1Id,
      assignedAt: new Date(Date.now() - 3600 * 1000 * 3),
      submittedAt: null,
      completedAt: null
    },
    {
      districtId: 1,
      mahallaId: 4,
      mahallaName: 'Damariq MFY',
      source: 'telegram',
      citizenPhone: '+998971239874',
      citizenFullName: 'Sobir Rahimov',
      beforePhotoUrl: trashPhoto,
      afterPhotoUrl: null,
      lat: 41.0200,
      lng: 71.5700,
      address: 'Damariq kanali bo‘yidagi maydon',
      description: 'Plastik va maishiy chiqindilar',
      status: 'in_progress',
      assignedWorkerId: worker2Id,
      assignedAt: new Date(Date.now() - 3600 * 1000 * 5),
      submittedAt: null,
      completedAt: null
    },
    {
      districtId: 1,
      mahallaId: 5,
      mahallaName: 'To\'qimachi MFY',
      source: 'web_portal',
      citizenPhone: '+998993332211',
      citizenFullName: 'Zohid Mirzayev',
      beforePhotoUrl: trashPhoto,
      afterPhotoUrl: cleanPhoto,
      lat: 41.0050,
      lng: 71.5850,
      address: 'To‘qimachi ko‘chasi, 8-bino',
      description: 'Katta hajmdagi ahlat to‘plami',
      status: 'submitted',
      assignedWorkerId: worker1Id,
      assignedAt: new Date(Date.now() - 3600 * 1000 * 8),
      submittedAt: new Date(Date.now() - 3600 * 1000 * 1),
      completedAt: null
    },
    {
      districtId: 1,
      mahallaId: 1,
      mahallaName: 'Yuksalish MFY',
      source: 'telegram',
      citizenPhone: '+998906661122',
      citizenFullName: 'Malika Ergasheva',
      beforePhotoUrl: trashPhoto,
      afterPhotoUrl: cleanPhoto,
      lat: 41.0125,
      lng: 71.5750,
      address: 'G‘alaba shoh ko‘chasi chorrahasi',
      description: 'Chiqindi idishlari atrofi tozalanishi zarur',
      status: 'completed',
      assignedWorkerId: worker1Id,
      assignedAt: new Date(Date.now() - 3600 * 1000 * 24),
      submittedAt: new Date(Date.now() - 3600 * 1000 * 18),
      completedAt: new Date(Date.now() - 3600 * 1000 * 16)
    },
    {
      districtId: 1,
      mahallaId: 2,
      mahallaName: 'Navbahor MFY',
      source: 'telegram',
      citizenPhone: '+998918884455',
      citizenFullName: 'Rustam Yusupov',
      beforePhotoUrl: trashPhoto,
      afterPhotoUrl: cleanPhoto,
      lat: 41.0165,
      lng: 71.5820,
      address: 'Navbahor 5-o‘tish yo‘li',
      description: 'Katta konteyner maydoni tozalash',
      status: 'completed',
      assignedWorkerId: worker2Id,
      assignedAt: new Date(Date.now() - 3600 * 1000 * 48),
      submittedAt: new Date(Date.now() - 3600 * 1000 * 30),
      completedAt: new Date(Date.now() - 3600 * 1000 * 28)
    }
  ];

  for (const req of demoRequests) {
    await client.query(`
      INSERT INTO requests (
        district_id, mahalla_id, mahalla_name, source,
        citizen_phone, citizen_full_name, before_photo_url, after_photo_url,
        lat, lng, address, description, status, assigned_worker_id,
        assigned_at, submitted_at, completed_at, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW()
      )
    `, [
      req.districtId, req.mahallaId, req.mahallaName, req.source,
      req.citizenPhone, req.citizenFullName, req.beforePhotoUrl, req.afterPhotoUrl,
      req.lat, req.lng, req.address, req.description, req.status, req.assignedWorkerId,
      req.assignedAt, req.submittedAt, req.completedAt
    ]);
  }

  console.log(`Successfully seeded ${demoRequests.length} demo requests!`);
  await client.end();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
