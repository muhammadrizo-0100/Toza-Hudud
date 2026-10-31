const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'toza_hudud_db'
};

const DAVLATOBOD_POLYGON = [
  [40.966141, 71.566367],
  [40.97196, 71.571334],
  [40.976357, 71.577328],
  [40.98696, 71.537249],
  [40.98877, 71.537421],
  [40.989933, 71.536564],
  [40.990321, 71.538448],
  [40.987347, 71.553863],
  [40.99239, 71.561742],
  [40.997431, 71.565339],
  [41.000404, 71.537935],
  [41.007578, 71.540271],
  [41.009667, 71.530463],
  [41.008361, 71.522155],
  [41.016023, 71.519501],
  [41.020463, 71.522271],
  [41.02499, 71.527001],
  [41.028124, 71.527925],
  [41.028907, 71.523194],
  [41.034478, 71.522848],
  [41.036392, 71.526078],
  [41.037959, 71.521117],
  [41.038568, 71.519963],
  [41.041179, 71.520194],
  [41.044312, 71.516848],
  [41.047967, 71.519732],
  [41.048489, 71.521463],
  [41.04962, 71.526886],
  [41.050664, 71.530925],
  [41.050577, 71.533578],
  [41.047619, 71.535771],
  [41.047967, 71.538309],
  [41.0511, 71.539578],
  [41.053014, 71.539002],
  [41.054493, 71.539232],
  [41.056233, 71.540271],
  [41.056407, 71.542463],
  [41.054493, 71.544425],
  [41.052057, 71.546271],
  [41.051274, 71.548117],
  [41.050926, 71.552271],
  [41.050229, 71.556425],
  [41.046923, 71.556886],
  [41.043964, 71.55804],
  [41.040135, 71.561271],
  [41.033694, 71.563233],
  [41.034826, 71.570848],
  [41.034652, 71.573963],
  [41.041005, 71.57604],
  [41.045356, 71.583425],
  [41.048924, 71.587694],
  [41.054493, 71.58781],
  [41.057538, 71.587117],
  [41.059278, 71.591041],
  [41.055189, 71.598079],
  [41.051709, 71.599233],
  [41.051361, 71.595079],
  [41.043529, 71.595656],
  [41.037176, 71.596348],
  [41.036653, 71.599233],
  [41.037611, 71.603271],
  [41.028994, 71.611002],
  [41.030213, 71.616541],
  [41.029603, 71.620348],
  [41.022988, 71.620348],
  [41.020898, 71.62981],
  [41.02055, 71.639503],
  [41.020289, 71.642156],
  [41.009319, 71.65681],
  [41.003398, 71.660157],
  [41.000002, 71.646195],
  [40.99199, 71.649426],
  [40.989987, 71.639503],
  [40.987983, 71.630618],
  [40.98328, 71.631426],
  [40.97997, 71.621156],
  [40.973436, 71.624387],
  [40.970823, 71.620925],
  [40.967425, 71.620233],
  [40.963417, 71.612271],
  [40.960542, 71.604425],
  [40.958799, 71.594964],
  [40.963417, 71.585964],
  [40.961761, 71.58654],
  [40.966641, 71.578117],
  [40.969342, 71.57131]
];

const NAMANGAN_DISTRICTS = [
  {
    name: 'Namangan shahri',
    code: 'namangan_shahar',
    centerLat: 40.9983,
    centerLng: 71.6726,
    polygon: [
      [40.965, 71.635],
      [40.995, 71.635],
      [41.015, 71.650],
      [41.018, 71.695],
      [40.995, 71.710],
      [40.970, 71.690],
      [40.960, 71.655],
      [40.965, 71.635]
    ],
    manager: {
      username: 'manager_namangan_shahar',
      password: 'NamanganShahar2026!',
      fullName: 'Mahmudov Ikromjon Odilovich',
      phone: '+998692271420',
      jobTitle: 'Toza Hudud DUK shahar filiali boshlig‘i'
    },
    mahallas: [
      { name: 'Bobur MFY', lat: 40.9950, lng: 71.6680 },
      { name: 'Nodirabegim MFY', lat: 40.9980, lng: 71.6750 },
      { name: 'Sardoba MFY', lat: 41.0020, lng: 71.6710 },
      { name: 'Lalazar MFY', lat: 41.0060, lng: 71.6820 },
      { name: 'Go‘zal MFY', lat: 40.9890, lng: 71.6600 },
      { name: 'Dashtbog‘ MFY', lat: 41.0120, lng: 71.6790 },
      { name: 'Chorsu MFY', lat: 40.9970, lng: 71.6830 },
      { name: 'Istiqlol MFY', lat: 41.0040, lng: 71.6900 },
      { name: 'Yangi Hayot MFY', lat: 40.9910, lng: 71.6780 },
      { name: 'Guliston MFY', lat: 41.0090, lng: 71.6650 }
    ]
  },
  {
    name: 'Davlatobod tumani',
    code: 'davlatobod',
    centerLat: 41.0108,
    centerLng: 71.5775,
    polygon: DAVLATOBOD_POLYGON,
    manager: {
      username: 'manager_davlatobod',
      password: 'Davlatobod2026!',
      fullName: 'Usmonov Rustam Zokirovich',
      phone: '+998692345511',
      jobTitle: 'Toza Hudud DUK Davlatobod filiali boshlig‘i'
    },
    mahallas: [
      { name: 'Navbahor MFY', lat: 41.0090, lng: 71.5820 },
      { name: 'Orzu MFY', lat: 41.0080, lng: 71.5650 },
      { name: 'To‘qimachi MFY', lat: 41.0050, lng: 71.5850 },
      { name: 'Yuksalish MFY', lat: 41.0150, lng: 71.5720 },
      { name: 'Damariq MFY', lat: 40.9980, lng: 71.5700 },
      { name: 'Porloq MFY', lat: 41.0200, lng: 71.5600 },
      { name: 'Elxon MFY', lat: 41.0250, lng: 71.5550 },
      { name: 'Gulshan MFY', lat: 41.0120, lng: 71.5900 },
      { name: 'Sohil MFY', lat: 40.9850, lng: 71.5600 },
      { name: 'Mustaqillik MFY', lat: 41.0180, lng: 71.5800 }
    ]
  },
  {
    name: 'Yangi Namangan tumani',
    code: 'yangi_namangan',
    centerLat: 41.0350,
    centerLng: 71.6500,
    polygon: [
      [41.015, 71.635],
      [41.030, 71.630],
      [41.050, 71.645],
      [41.065, 71.665],
      [41.055, 71.695],
      [41.035, 71.700],
      [41.015, 71.670],
      [41.015, 71.635]
    ],
    manager: {
      username: 'manager_yangi_namangan',
      password: 'YangiNamangan2026!',
      fullName: 'Qodirov Elyor Baxtiyorovich',
      phone: '+998692398822',
      jobTitle: 'Toza Hudud DUK Yangi Namangan filiali boshlig‘i'
    },
    mahallas: [
      { name: 'Sihatgoh MFY', lat: 41.0310, lng: 71.6420 },
      { name: 'Mingchinor MFY', lat: 41.0380, lng: 71.6480 },
      { name: 'Oydin MFY', lat: 41.0280, lng: 71.6550 },
      { name: 'Mehriddin MFY', lat: 41.0420, lng: 71.6390 },
      { name: 'Yoshlik MFY', lat: 41.0350, lng: 71.6600 },
      { name: 'Bunyodkor MFY', lat: 41.0480, lng: 71.6520 },
      { name: 'Otchopar MFY', lat: 41.0220, lng: 71.6680 },
      { name: 'Ishonch MFY', lat: 41.0400, lng: 71.6700 },
      { name: 'Gulbog‘ MFY', lat: 41.0300, lng: 71.6350 }
    ]
  },
  {
    name: 'Chust tumani',
    code: 'chust',
    centerLat: 41.0089,
    centerLng: 71.2289,
    polygon: [
      [40.950, 71.180],
      [41.010, 71.170],
      [41.080, 71.180],
      [41.150, 71.220],
      [41.120, 71.310],
      [41.040, 71.300],
      [40.970, 71.260],
      [40.950, 71.180]
    ],
    manager: {
      username: 'manager_chust',
      password: 'Chust2026!',
      fullName: 'Jo‘rayev Sherzodbek Sobirovich',
      phone: '+998694212301',
      jobTitle: 'Toza Hudud DUK Chust filiali boshlig‘i'
    },
    mahallas: [
      { name: 'Bibiona MFY', lat: 41.0120, lng: 71.2250 },
      { name: 'Varzik MFY', lat: 41.0600, lng: 71.1900 },
      { name: 'G‘ova MFY', lat: 41.1300, lng: 71.1800 },
      { name: 'Chustiy MFY', lat: 41.0050, lng: 71.2320 },
      { name: 'Do‘stlik MFY', lat: 41.0010, lng: 71.2400 },
      { name: 'Olmos MFY', lat: 41.0450, lng: 71.2600 },
      { name: 'Karkidon MFY', lat: 41.0300, lng: 71.2800 },
      { name: 'Yangiobod MFY', lat: 40.9950, lng: 71.2150 },
      { name: 'Kamarsada MFY', lat: 41.0180, lng: 71.2100 }
    ]
  },
  {
    name: 'Kosonsoy tumani',
    code: 'kosonsoy',
    centerLat: 41.2500,
    centerLng: 71.5500,
    polygon: [
      [41.150, 71.460],
      [41.220, 71.420],
      [41.340, 71.480],
      [41.360, 71.600],
      [41.280, 71.660],
      [41.180, 71.610],
      [41.150, 71.530],
      [41.150, 71.460]
    ],
    manager: {
      username: 'manager_kosonsoy',
      password: 'Kosonsoy2026!',
      fullName: 'Aliyev Dilshodbek Tohirovich',
      phone: '+998696521405',
      jobTitle: 'Toza Hudud DUK Kosonsoy filiali boshlig‘i'
    },
    mahallas: [
      { name: 'Chindovul MFY', lat: 41.2450, lng: 71.5450 },
      { name: 'Tergachi MFY', lat: 41.2650, lng: 71.5600 },
      { name: 'Ququmboy MFY', lat: 41.2350, lng: 71.5300 },
      { name: 'Bog‘bon MFY', lat: 41.2550, lng: 71.5550 },
      { name: 'Obod MFY', lat: 41.2400, lng: 71.5620 },
      { name: 'Koson MFY', lat: 41.2520, lng: 71.5400 },
      { name: 'Yangiyo‘l MFY', lat: 41.2700, lng: 71.5200 },
      { name: 'Bo‘ston MFY', lat: 41.2280, lng: 71.5700 }
    ]
  },
  {
    name: 'Chortoq tumani',
    code: 'chortoq',
    centerLat: 41.0667,
    centerLng: 71.8167,
    polygon: [
      [41.030, 71.750],
      [41.080, 71.750],
      [41.150, 71.780],
      [41.190, 71.860],
      [41.120, 71.920],
      [41.050, 71.880],
      [41.030, 71.820],
      [41.030, 71.750]
    ],
    manager: {
      username: 'manager_chortoq',
      password: 'Chortoq2026!',
      fullName: 'Rahmatullayev Jasur Erkinovich',
      phone: '+998694121919',
      jobTitle: 'Toza Hudud DUK Chortoq filiali boshlig‘i'
    },
    mahallas: [
      { name: 'Alixon MFY', lat: 41.1100, lng: 71.8300 },
      { name: 'Oyqiron MFY', lat: 41.0800, lng: 71.8000 },
      { name: 'Bog‘iston MFY', lat: 41.0650, lng: 71.8200 },
      { name: 'Hazrati Shoh MFY', lat: 41.1400, lng: 71.8500 },
      { name: 'Namuna MFY', lat: 41.0550, lng: 71.8100 },
      { name: 'Yangiqadam MFY', lat: 41.0600, lng: 71.8250 },
      { name: 'Saroy MFY', lat: 41.0720, lng: 71.7950 },
      { name: 'Gulshan MFY', lat: 41.0500, lng: 71.8350 }
    ]
  },
  {
    name: 'Pop tumani',
    code: 'pop',
    centerLat: 41.0167,
    centerLng: 71.1000,
    polygon: [
      [40.820, 70.800],
      [40.980, 70.850],
      [41.180, 70.920],
      [41.250, 71.100],
      [41.050, 71.180],
      [40.900, 71.150],
      [40.800, 70.950],
      [40.820, 70.800]
    ],
    manager: {
      username: 'manager_pop',
      password: 'Pop2026!',
      fullName: 'Xolmatov Otabek Shavkatovich',
      phone: '+998694321010',
      jobTitle: 'Toza Hudud DUK Pop filiali boshlig‘i'
    },
    mahallas: [
      { name: 'Chorkesar MFY', lat: 41.1600, lng: 71.0200 },
      { name: 'Uyg‘ursoy MFY', lat: 41.0800, lng: 70.9800 },
      { name: 'Gurrumsaroy MFY', lat: 40.9100, lng: 71.0800 },
      { name: 'Sang MFY', lat: 41.0400, lng: 71.1200 },
      { name: 'Yangiobod MFY', lat: 41.0120, lng: 71.0950 },
      { name: 'Navbahor MFY', lat: 41.0200, lng: 71.1100 },
      { name: 'Vodiy MFY', lat: 40.9850, lng: 71.1300 },
      { name: 'Paxtakor MFY', lat: 40.9600, lng: 71.1500 }
    ]
  },
  {
    name: 'To‘raqo‘rg‘on tumani',
    code: 'toraqorgon',
    centerLat: 41.0000,
    centerLng: 71.5167,
    polygon: [
      [40.920, 71.420],
      [40.990, 71.420],
      [41.050, 71.480],
      [41.040, 71.540],
      [40.970, 71.540],
      [40.920, 71.490],
      [40.920, 71.420]
    ],
    manager: {
      username: 'manager_toraqorgon',
      password: 'Toraqorgon2026!',
      fullName: 'Rasulov Mansurbek Ilhomovich',
      phone: '+998694421520',
      jobTitle: 'Toza Hudud DUK To‘raqo‘rg‘on filiali boshlig‘i'
    },
    mahallas: [
      { name: 'Isfahon MFY', lat: 41.0050, lng: 71.5100 },
      { name: 'Shahand MFY', lat: 40.9700, lng: 71.4900 },
      { name: 'Mozorko‘hna MFY', lat: 41.0120, lng: 71.5220 },
      { name: 'Saroy MFY', lat: 40.9920, lng: 71.5050 },
      { name: 'Kumidon MFY', lat: 41.0200, lng: 71.5300 },
      { name: 'Axsi MFY', lat: 40.9100, lng: 71.4500 },
      { name: 'Yortepa MFY', lat: 41.0250, lng: 71.4800 },
      { name: 'Guliston MFY', lat: 40.9980, lng: 71.5280 }
    ]
  },
  {
    name: 'Uchqo‘rg‘on tumani',
    code: 'uchqorgon',
    centerLat: 41.1167,
    centerLng: 72.0833,
    polygon: [
      [41.050, 72.020],
      [41.120, 71.980],
      [41.220, 72.050],
      [41.200, 72.180],
      [41.100, 72.190],
      [41.040, 72.110],
      [41.050, 72.020]
    ],
    manager: {
      username: 'manager_uchqorgon',
      password: 'Uchqorgon2026!',
      fullName: 'Turg‘unov Sanjarbek Qobilovich',
      phone: '+998694622133',
      jobTitle: 'Toza Hudud DUK Uchqo‘rg‘on filiali boshlig‘i'
    },
    mahallas: [
      { name: 'Qayqi MFY', lat: 41.1300, lng: 72.0600 },
      { name: 'Qo‘g‘ay MFY', lat: 41.0900, lng: 72.1000 },
      { name: 'Yangiobod MFY', lat: 41.1200, lng: 72.0800 },
      { name: 'Dehqonobod MFY', lat: 41.1100, lng: 72.0750 },
      { name: 'O‘zbekiston MFY', lat: 41.1150, lng: 72.0950 },
      { name: 'Bo‘ston MFY', lat: 41.1050, lng: 72.0650 },
      { name: 'Madaniyat MFY', lat: 41.1450, lng: 72.0500 }
    ]
  },
  {
    name: 'Uychi tumani',
    code: 'uychi',
    centerLat: 41.0833,
    centerLng: 71.9167,
    polygon: [
      [41.020, 71.860],
      [41.080, 71.870],
      [41.140, 71.920],
      [41.130, 72.020],
      [41.060, 72.030],
      [41.010, 71.960],
      [41.020, 71.860]
    ],
    manager: {
      username: 'manager_uychi',
      password: 'Uychi2026!',
      fullName: 'Karimov Botirjon Anvarovich',
      phone: '+998694821444',
      jobTitle: 'Toza Hudud DUK Uychi filiali boshlig‘i'
    },
    mahallas: [
      { name: 'Jiydakapa MFY', lat: 41.0950, lng: 71.8900 },
      { name: 'Qizil Ravot MFY', lat: 41.0700, lng: 71.9300 },
      { name: 'Mashad MFY', lat: 41.1200, lng: 71.9000 },
      { name: 'Boyg‘ozi MFY', lat: 41.0850, lng: 71.9100 },
      { name: 'Birlashgan MFY', lat: 41.0780, lng: 71.9250 },
      { name: 'Rovot MFY', lat: 41.0600, lng: 71.9400 },
      { name: 'Chaqar MFY', lat: 41.1000, lng: 71.9500 }
    ]
  },
  {
    name: 'Mingbuloq tumani',
    code: 'mingbuloq',
    centerLat: 40.7167,
    centerLng: 71.3000,
    polygon: [
      [40.600, 71.150],
      [40.750, 71.150],
      [40.820, 71.280],
      [40.800, 71.480],
      [40.680, 71.500],
      [40.600, 71.320],
      [40.600, 71.150]
    ],
    manager: {
      username: 'manager_mingbuloq',
      password: 'Mingbuloq2026!',
      fullName: 'Sodiqov Farruxbek Nurmatovich',
      phone: '+998694521755',
      jobTitle: 'Toza Hudud DUK Mingbuloq filiali boshlig‘i'
    },
    mahallas: [
      { name: 'Jomasho‘y MFY', lat: 40.7200, lng: 71.2950 },
      { name: 'Go‘rtepa MFY', lat: 40.7450, lng: 71.3200 },
      { name: 'Gigant MFY', lat: 40.7000, lng: 71.2800 },
      { name: 'Qo‘g‘aliko‘l MFY', lat: 40.7350, lng: 71.2600 },
      { name: 'Mehnatobod MFY', lat: 40.6900, lng: 71.3400 },
      { name: 'Gulbog‘ MFY', lat: 40.7100, lng: 71.3100 },
      { name: 'Madaniyat MFY', lat: 40.7500, lng: 71.2800 }
    ]
  },
  {
    name: 'Norin tumani',
    code: 'norin',
    centerLat: 40.8500,
    centerLng: 72.0333,
    polygon: [
      [40.760, 71.920],
      [40.840, 71.920],
      [40.920, 72.020],
      [40.900, 72.150],
      [40.800, 72.150],
      [40.750, 72.040],
      [40.760, 71.920]
    ],
    manager: {
      username: 'manager_norin',
      password: 'Norin2026!',
      fullName: 'Normatov Ulug‘bek Vosiljonovich',
      phone: '+998696121866',
      jobTitle: 'Toza Hudud DUK Norin filiali boshlig‘i'
    },
    mahallas: [
      { name: 'Haqqulobod MFY', lat: 40.8550, lng: 72.0300 },
      { name: 'Uchtepa MFY', lat: 40.8700, lng: 72.0500 },
      { name: 'Qorayog‘och MFY', lat: 40.8400, lng: 72.0200 },
      { name: 'Xo‘jaobod MFY', lat: 40.8800, lng: 72.0100 },
      { name: 'Qoratepa MFY', lat: 40.8300, lng: 72.0400 },
      { name: 'Sho‘rariq MFY', lat: 40.8600, lng: 72.0650 },
      { name: 'To‘da MFY', lat: 40.8250, lng: 72.0150 }
    ]
  },
  {
    name: 'Yangiqo‘rg‘on tumani',
    code: 'yangiqorgon',
    centerLat: 41.1833,
    centerLng: 71.7333,
    polygon: [
      [41.120, 71.640],
      [41.200, 71.650],
      [41.320, 71.720],
      [41.330, 71.880],
      [41.220, 71.880],
      [41.140, 71.770],
      [41.120, 71.640]
    ],
    manager: {
      username: 'manager_yangiqorgon',
      password: 'Yangiqorgon2026!',
      fullName: 'Ahmadaliyev Oybek Ergashevich',
      phone: '+998696321977',
      jobTitle: 'Toza Hudud DUK Yangiqo‘rg‘on filiali boshlig‘i'
    },
    mahallas: [
      { name: 'Bekobod MFY', lat: 41.1800, lng: 71.7300 },
      { name: 'Nanay MFY', lat: 41.2500, lng: 71.8200 },
      { name: 'Zarkent MFY', lat: 41.2200, lng: 71.7800 },
      { name: 'Poromon MFY', lat: 41.1600, lng: 71.7100 },
      { name: 'Qizilo‘roq MFY', lat: 41.1950, lng: 71.7450 },
      { name: 'Navro‘z MFY', lat: 41.1750, lng: 71.7200 },
      { name: 'G‘ovazon MFY', lat: 41.2100, lng: 71.7600 }
    ]
  },
  {
    name: 'Namangan tumani',
    code: 'namangan_tuman',
    centerLat: 40.9500,
    centerLng: 71.6000,
    polygon: [
      [40.880, 71.520],
      [40.950, 71.530],
      [40.970, 71.600],
      [40.950, 71.680],
      [40.880, 71.680],
      [40.850, 71.580],
      [40.880, 71.520]
    ],
    manager: {
      username: 'manager_namangan_tuman',
      password: 'NamanganTuman2026!',
      fullName: 'Sobirov Doniyorbek Hamdamovich',
      phone: '+998692285188',
      jobTitle: 'Toza Hudud DUK Namangan tumani filiali boshlig‘i'
    },
    mahallas: [
      { name: 'Toshbuloq MFY', lat: 40.9450, lng: 71.5950 },
      { name: 'Mirishkor MFY', lat: 40.9600, lng: 71.6100 },
      { name: 'Sho‘rqishloq MFY', lat: 40.9300, lng: 71.5800 },
      { name: 'Qumqo‘rg‘on MFY', lat: 40.9200, lng: 71.6200 },
      { name: 'Tepaqo‘rg‘on MFY', lat: 40.9550, lng: 71.5750 },
      { name: 'Qoratepa MFY', lat: 40.9400, lng: 71.6300 },
      { name: 'O‘rta Rovot MFY', lat: 40.9150, lng: 71.5600 }
    ]
  }
];

async function main() {
  const client = new Client(dbConfig);
  await client.connect();
  console.log('✅ PostgreSQL bazasiga ulandi');

  try {
    await client.query('BEGIN');

    // 1. SuperAdmin mavjudligini ta'minlash
    const superadminCheck = await client.query("SELECT id FROM admins WHERE username = 'admin'");
    if (superadminCheck.rows.length === 0) {
      const superHash = await bcrypt.hash('admin123', 10);
      await client.query(
        `INSERT INTO admins (username, password_hash, full_name, phone, job_title, role, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'SuperAdmin', true, NOW(), NOW())`,
        ['admin', superHash, 'Bosh Boshqaruvchi (SuperAdmin)', '+998901234567', 'Tizim Bosh Administratori']
      );
      console.log('👑 SuperAdmin yaratildi: admin / admin123');
    } else {
      console.log('👑 SuperAdmin mavjud (saqlab qolindi)');
    }

    console.log(`\n📍 Namangan viloyatining jami ${NAMANGAN_DISTRICTS.length} ta tuman va shahri kiritilmoqda...\n`);

    const resultSummary = [];

    for (const dist of NAMANGAN_DISTRICTS) {
      // District check/insert
      let distId;
      const distCheck = await client.query('SELECT id FROM districts WHERE code = $1', [dist.code]);
      if (distCheck.rows.length > 0) {
        distId = distCheck.rows[0].id;
        await client.query(
          `UPDATE districts 
           SET name = $1, center_lat = $2, center_lng = $3, polygon = $4, is_active = true, updated_at = NOW()
           WHERE id = $5`,
          [dist.name, dist.centerLat, dist.centerLng, JSON.stringify(dist.polygon), distId]
        );
      } else {
        const distInsert = await client.query(
          `INSERT INTO districts (name, code, center_lat, center_lng, polygon, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
           RETURNING id`,
          [dist.name, dist.code, dist.centerLat, dist.centerLng, JSON.stringify(dist.polygon)]
        );
        distId = distInsert.rows[0].id;
      }

      // Mahallas insert
      let mahallaCount = 0;
      for (const m of dist.mahallas) {
        const mCheck = await client.query(
          'SELECT id FROM mahallas WHERE district_id = $1 AND name = $2',
          [distId, m.name]
        );
        if (mCheck.rows.length === 0) {
          await client.query(
            `INSERT INTO mahallas (district_id, name, center_lat, center_lng, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())`,
            [distId, m.name, m.lat, m.lng]
          );
        } else {
          await client.query(
            `UPDATE mahallas 
             SET center_lat = $1, center_lng = $2, updated_at = NOW() 
             WHERE id = $3`,
            [m.lat, m.lng, mCheck.rows[0].id]
          );
        }
        mahallaCount++;
      }

      // Manager account check/insert
      const mgr = dist.manager;
      const mgrHash = await bcrypt.hash(mgr.password, 10);
      const mgrCheck = await client.query('SELECT id FROM admins WHERE username = $1', [mgr.username]);

      if (mgrCheck.rows.length > 0) {
        await client.query(
          `UPDATE admins 
           SET password_hash = $1, full_name = $2, phone = $3, job_title = $4, role = 'Manager', district_id = $5, is_active = true, updated_at = NOW()
           WHERE id = $6`,
          [mgrHash, mgr.fullName, mgr.phone, mgr.jobTitle, distId, mgrCheck.rows[0].id]
        );
      } else {
        await client.query(
          `INSERT INTO admins (username, password_hash, full_name, phone, job_title, role, district_id, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, 'Manager', $6, true, NOW(), NOW())`,
          [mgr.username, mgrHash, mgr.fullName, mgr.phone, mgr.jobTitle, distId]
        );
      }

      resultSummary.push({
        districtName: dist.name,
        code: dist.code,
        mahallaCount,
        managerUsername: mgr.username,
        managerPassword: mgr.password,
        managerFullName: mgr.fullName,
        phone: mgr.phone
      });
      console.log(`✅ ${dist.name}: ${mahallaCount} ta mahalla, Boshliq: ${mgr.username} (${mgr.fullName})`);
    }

    await client.query('COMMIT');
    console.log('\n🎉 Barcha maʼlumotlar muvaffaqiyatli saqlandi!');
    console.log(JSON.stringify(resultSummary, null, 2));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Xatolik yuz berdi:', err);
    throw err;
  } finally {
    await client.end();
  }
}

main().catch(() => process.exit(1));
