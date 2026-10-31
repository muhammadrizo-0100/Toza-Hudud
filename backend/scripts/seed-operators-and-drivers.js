const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'toza_hudud_db'
};

const STAFF_DATA = [
  {
    districtCode: 'namangan_shahar',
    districtName: 'Namangan shahri',
    operators: [
      {
        username: 'operator1_namangan_shahar',
        password: 'OpNamShahar1_2026!',
        fullName: 'Alimova Ziyoda Baxtiyorovna',
        phone: '+998692271421'
      },
      {
        username: 'operator2_namangan_shahar',
        password: 'OpNamShahar2_2026!',
        fullName: 'Yuldashev Jasurbek Ravshanovich',
        phone: '+998692271422'
      }
    ],
    drivers: [
      {
        fullName: 'Rahimov Botirjon Rustamovich',
        phone: '+998901235001',
        vehicleNumber: '50 101 TAA'
      },
      {
        fullName: 'Karimov Doniyor Anvarovich',
        phone: '+998901235002',
        vehicleNumber: '50 102 TAA'
      }
    ]
  },
  {
    districtCode: 'davlatobod',
    districtName: 'Davlatobod tumani',
    operators: [
      {
        username: 'operator1_davlatobod',
        password: 'OpDavlatobod1_2026!',
        fullName: 'Sobirova Shahlo Odilovna',
        phone: '+998692345512'
      },
      {
        username: 'operator2_davlatobod',
        password: 'OpDavlatobod2_2026!',
        fullName: 'Mansurov Sardor Ilhomovich',
        phone: '+998692345513'
      }
    ],
    drivers: [
      {
        fullName: 'Xoliqov Jamshid Murodovich',
        phone: '+998901235003',
        vehicleNumber: '50 201 TAA'
      },
      {
        fullName: 'Yoqubov Farhod Nematovich',
        phone: '+998901235004',
        vehicleNumber: '50 202 TAA'
      }
    ]
  },
  {
    districtCode: 'yangi_namangan',
    districtName: 'Yangi Namangan tumani',
    operators: [
      {
        username: 'operator1_yangi_namangan',
        password: 'OpYangiNam1_2026!',
        fullName: 'G‘aniyeva Madina Sherzodovna',
        phone: '+998692398823'
      },
      {
        username: 'operator2_yangi_namangan',
        password: 'OpYangiNam2_2026!',
        fullName: 'Qosimov Umidjon Ikromovich',
        phone: '+998692398824'
      }
    ],
    drivers: [
      {
        fullName: 'Nazarov Boburjon Akramovich',
        phone: '+998901235005',
        vehicleNumber: '50 301 TAA'
      },
      {
        fullName: 'Bekmirzayev Dilshod Olimovich',
        phone: '+998901235006',
        vehicleNumber: '50 302 TAA'
      }
    ]
  },
  {
    districtCode: 'chust',
    districtName: 'Chust tumani',
    operators: [
      {
        username: 'operator1_chust',
        password: 'OpChust1_2026!',
        fullName: 'Husanova Dilnoza Tohirovna',
        phone: '+998694212302'
      },
      {
        username: 'operator2_chust',
        password: 'OpChust2_2026!',
        fullName: 'Sharipov Sanjar Shuhratovich',
        phone: '+998694212303'
      }
    ],
    drivers: [
      {
        fullName: 'Ergashev Rustam To‘lqirovich',
        phone: '+998901235007',
        vehicleNumber: '50 401 TAA'
      },
      {
        fullName: 'Tursunov Baxtiyor Qodirovich',
        phone: '+998901235008',
        vehicleNumber: '50 402 TAA'
      }
    ]
  },
  {
    districtCode: 'kosonsoy',
    districtName: 'Kosonsoy tumani',
    operators: [
      {
        username: 'operator1_kosonsoy',
        password: 'OpKosonsoy1_2026!',
        fullName: 'Azizova Mohira Kamolovna',
        phone: '+998696521406'
      },
      {
        username: 'operator2_kosonsoy',
        password: 'OpKosonsoy2_2026!',
        fullName: 'Mirzayev Asadbek Alisherovich',
        phone: '+998696521407'
      }
    ],
    drivers: [
      {
        fullName: 'Sultonov Shuhrat Valiyevich',
        phone: '+998901235009',
        vehicleNumber: '50 501 TAA'
      },
      {
        fullName: 'Ismoilov Sherali Zokirovich',
        phone: '+998901235010',
        vehicleNumber: '50 502 TAA'
      }
    ]
  },
  {
    districtCode: 'chortoq',
    districtName: 'Chortoq tumani',
    operators: [
      {
        username: 'operator1_chortoq',
        password: 'OpChortoq1_2026!',
        fullName: 'Jalilova Nilufar Bahodirovna',
        phone: '+998694121920'
      },
      {
        username: 'operator2_chortoq',
        password: 'OpChortoq2_2026!',
        fullName: 'Habibullayev Elyor Erkinovich',
        phone: '+998694121921'
      }
    ],
    drivers: [
      {
        fullName: 'Olimov Muzaffar Hakimboyevich',
        phone: '+998901235011',
        vehicleNumber: '50 601 TAA'
      },
      {
        fullName: 'Madaminov Jahongir Sobirovich',
        phone: '+998901235012',
        vehicleNumber: '50 602 TAA'
      }
    ]
  },
  {
    districtCode: 'pop',
    districtName: 'Pop tumani',
    operators: [
      {
        username: 'operator1_pop',
        password: 'OpPop1_2026!',
        fullName: 'Saidova Gulchehra Normatovna',
        phone: '+998694321011'
      },
      {
        username: 'operator2_pop',
        password: 'OpPop2_2026!',
        fullName: 'Dadaxonov Akmal Rustamovich',
        phone: '+998694321012'
      }
    ],
    drivers: [
      {
        fullName: 'Normurodov Abdullajon Sotvoldiyevich',
        phone: '+998901235013',
        vehicleNumber: '50 701 TAA'
      },
      {
        fullName: 'Tohirov Ilhomjon Mirzayevich',
        phone: '+998901235014',
        vehicleNumber: '50 702 TAA'
      }
    ]
  },
  {
    districtCode: 'toraqorgon',
    districtName: 'To‘raqo‘rg‘on tumani',
    operators: [
      {
        username: 'operator1_toraqorgon',
        password: 'OpToraqorgon1_2026!',
        fullName: 'Qodirova Feruza Mansurovna',
        phone: '+998694421521'
      },
      {
        username: 'operator2_toraqorgon',
        password: 'OpToraqorgon2_2026!',
        fullName: 'Tojiyev Nodirbek Otabekovich',
        phone: '+998694421522'
      }
    ],
    drivers: [
      {
        fullName: 'Axmedov Sirojiddin Vosilovich',
        phone: '+998901235015',
        vehicleNumber: '50 801 TAA'
      },
      {
        fullName: 'G‘ulomov O‘tkirbek Jamshidovich',
        phone: '+998901235016',
        vehicleNumber: '50 802 TAA'
      }
    ]
  },
  {
    districtCode: 'uchqorgon',
    districtName: 'Uchqo‘rg‘on tumani',
    operators: [
      {
        username: 'operator1_uchqorgon',
        password: 'OpUchqorgon1_2026!',
        fullName: 'Xolmirzayeva Munira Sanjarovna',
        phone: '+998694622134'
      },
      {
        username: 'operator2_uchqorgon',
        password: 'OpUchqorgon2_2026!',
        fullName: 'Mamatov Dostonbek Qobilovich',
        phone: '+998694622135'
      }
    ],
    drivers: [
      {
        fullName: 'Yusupov Ravshanbek Sobirovich',
        phone: '+998901235017',
        vehicleNumber: '50 901 TAA'
      },
      {
        fullName: 'Boymatov Azizbek Hamidovich',
        phone: '+998901235018',
        vehicleNumber: '50 902 TAA'
      }
    ]
  },
  {
    districtCode: 'uychi',
    districtName: 'Uychi tumani',
    operators: [
      {
        username: 'operator1_uychi',
        password: 'OpUychi1_2026!',
        fullName: 'Ismoilova Rayhona Botirovna',
        phone: '+998694821445'
      },
      {
        username: 'operator2_uychi',
        password: 'OpUychi2_2026!',
        fullName: 'Nosirov Dilmurod Anvarovich',
        phone: '+998694821446'
      }
    ],
    drivers: [
      {
        fullName: 'Zokirov Qahramon Nabiyevich',
        phone: '+998901235019',
        vehicleNumber: '50 111 TBA'
      },
      {
        fullName: 'Sultonov Sardorbek Xalilovich',
        phone: '+998901235020',
        vehicleNumber: '50 112 TBA'
      }
    ]
  },
  {
    districtCode: 'mingbuloq',
    districtName: 'Mingbuloq tumani',
    operators: [
      {
        username: 'operator1_mingbuloq',
        password: 'OpMingbuloq1_2026!',
        fullName: 'Oripova Malika Farruxovna',
        phone: '+998694521756'
      },
      {
        username: 'operator2_mingbuloq',
        password: 'OpMingbuloq2_2026!',
        fullName: 'Yoqubov Sarvarbek Nurmatovich',
        phone: '+998694521757'
      }
    ],
    drivers: [
      {
        fullName: 'Anvarov Shavkatbek Shokirovich',
        phone: '+998901235021',
        vehicleNumber: '50 121 TBA'
      },
      {
        fullName: 'Temirov G‘ayratjon Po‘latovich',
        phone: '+998901235022',
        vehicleNumber: '50 122 TBA'
      }
    ]
  },
  {
    districtCode: 'norin',
    districtName: 'Norin tumani',
    operators: [
      {
        username: 'operator1_norin',
        password: 'OpNorin1_2026!',
        fullName: 'Rahmatova Dilorom Ulug‘bekovna',
        phone: '+998696121867'
      },
      {
        username: 'operator2_norin',
        password: 'OpNorin2_2026!',
        fullName: 'Hojiyev Oybek Vosiljonovich',
        phone: '+998696121868'
      }
    ],
    drivers: [
      {
        fullName: 'Mirzavaliyev Abrorbek Karimovich',
        phone: '+998901235023',
        vehicleNumber: '50 131 TBA'
      },
      {
        fullName: 'Xolmatov Sanjarbek Saydaliyevich',
        phone: '+998901235024',
        vehicleNumber: '50 132 TBA'
      }
    ]
  },
  {
    districtCode: 'yangiqorgon',
    districtName: 'Yangiqo‘rg‘on tumani',
    operators: [
      {
        username: 'operator1_yangiqorgon',
        password: 'OpYangiqorgon1_2026!',
        fullName: 'Ergasheva Sevara Oybekovna',
        phone: '+998696321978'
      },
      {
        username: 'operator2_yangiqorgon',
        password: 'OpYangiqorgon2_2026!',
        fullName: 'Murodov Shahzodbek Ergashevich',
        phone: '+998696321979'
      }
    ],
    drivers: [
      {
        fullName: 'Boqiyev Sherali Abduvaliyevich',
        phone: '+998901235025',
        vehicleNumber: '50 141 TBA'
      },
      {
        fullName: 'Mirzayev Mansurjon Davronovich',
        phone: '+998901235026',
        vehicleNumber: '50 142 TBA'
      }
    ]
  },
  {
    districtCode: 'namangan_tuman',
    districtName: 'Namangan tumani',
    operators: [
      {
        username: 'operator1_namangan_tuman',
        password: 'OpNamTuman1_2026!',
        fullName: 'Komilova Gulnoza Doniyorovna',
        phone: '+998692285189'
      },
      {
        username: 'operator2_namangan_tuman',
        password: 'OpNamTuman2_2026!',
        fullName: 'Hakimov Bekzod Hamdamovich',
        phone: '+998692285190'
      }
    ],
    drivers: [
      {
        fullName: 'Karimov Ilhomjon Faxriddinovich',
        phone: '+998901235027',
        vehicleNumber: '50 151 TBA'
      },
      {
        fullName: 'Shukurov Mirzohid Ne’matovich',
        phone: '+998901235028',
        vehicleNumber: '50 152 TBA'
      }
    ]
  }
];

async function seed() {
  const client = new Client(dbConfig);
  await client.connect();
  console.log('✅ PostgreSQL bazasiga ulandi');

  try {
    await client.query('BEGIN');

    let opCreated = 0;
    let drCreated = 0;

    for (const item of STAFF_DATA) {
      // Find district ID by code
      const distRes = await client.query('SELECT id, name FROM districts WHERE code = $1', [item.districtCode]);
      if (distRes.rows.length === 0) {
        console.warn(`⚠️ Tuman topilmadi: ${item.districtCode}`);
        continue;
      }
      const districtId = distRes.rows[0].id;

      // 1. Operators -> admins table
      for (const op of item.operators) {
        const passwordHash = await bcrypt.hash(op.password, 10);
        const existingAdmin = await client.query('SELECT id FROM admins WHERE username = $1', [op.username]);
        if (existingAdmin.rows.length > 0) {
          await client.query(
            `UPDATE admins
             SET password_hash = $1, full_name = $2, phone = $3, job_title = $4, role = 'Dispatcher', district_id = $5, is_active = true, updated_at = NOW()
             WHERE id = $6`,
            [passwordHash, op.fullName, op.phone, `Toza Hudud DUK ${item.districtName} operatori`, districtId, existingAdmin.rows[0].id]
          );
        } else {
          await client.query(
            `INSERT INTO admins (username, password_hash, full_name, phone, job_title, role, district_id, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, 'Dispatcher', $6, true, NOW(), NOW())`,
            [op.username, passwordHash, op.fullName, op.phone, `Toza Hudud DUK ${item.districtName} operatori`, districtId]
          );
        }
        opCreated++;
      }

      // 2. Drivers -> workers table
      for (const dr of item.drivers) {
        const existingWorker = await client.query('SELECT id FROM workers WHERE phone = $1', [dr.phone]);
        if (existingWorker.rows.length > 0) {
          await client.query(
            `UPDATE workers
             SET full_name = $1, vehicle_number = $2, district_id = $3, is_active = true, updated_at = NOW()
             WHERE id = $4`,
            [dr.fullName, dr.vehicleNumber, districtId, existingWorker.rows[0].id]
          );
        } else {
          await client.query(
            `INSERT INTO workers (district_id, full_name, phone, vehicle_number, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, true, NOW(), NOW())`,
            [districtId, dr.fullName, dr.phone, dr.vehicleNumber]
          );
        }
        drCreated++;
      }

      console.log(`✅ ${item.districtName}: 2 ta operator va 2 ta haydovchi muvaffaqiyatli saqlandi`);
    }

    await client.query('COMMIT');
    console.log(`\n🎉 Hammasi tayyor! Jami ${opCreated} ta operator va ${drCreated} ta haydovchi bazaga kiritildi.`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Xatolik yuz berdi:', err);
    throw err;
  } finally {
    await client.end();
  }
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
