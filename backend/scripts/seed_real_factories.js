const mongoose = require('mongoose');
const Factory = require('../models/Factory');
require('dotenv').config({ path: 'backend/.env' });

const seedFactories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Clear existing
    await Factory.deleteMany({});
    
    const factories = [
      {
        name: 'Sahyadri Sahakari Sakhar Karkhana',
        district: 'Satara',
        taluka: 'Karad',
        fullAddress: 'Yashwantnagar, Karad, Satara, Maharashtra 415115',
        contact: '02164-222345',
        isOpen: true,
        frpRate: 3100,
        capacity: '5000 T/D',
        rating: 4.8,
        established: 1969,
        coordinates: { lat: 17.2917, lng: 74.1751 }
      },
      {
        name: 'Krishna Sahakari Sakhar Karkhana',
        district: 'Satara',
        taluka: 'Karad',
        fullAddress: 'Rethare Bk, Karad, Satara, Maharashtra 415108',
        contact: '02164-245678',
        isOpen: true,
        frpRate: 3200,
        capacity: '7500 T/D',
        rating: 4.7,
        established: 1955,
        coordinates: { lat: 17.2286, lng: 74.2253 }
      },
      {
        name: 'Vasantdada Patil SSK',
        district: 'Sangli',
        taluka: 'Miraj',
        fullAddress: 'Madhavnagar Road, Sangli, Maharashtra 416416',
        contact: '0233-2310123',
        isOpen: false,
        frpRate: 3150,
        capacity: '4500 T/D',
        rating: 4.5,
        established: 1958,
        coordinates: { lat: 16.8524, lng: 74.5815 }
      },
      {
        name: 'Rajarambapu Patil SSK',
        district: 'Sangli',
        taluka: 'Walwa',
        fullAddress: 'Rajaramnagar, Islampur, Sangli, Maharashtra 415414',
        contact: '02342-220123',
        isOpen: true,
        frpRate: 3300,
        capacity: '6000 T/D',
        rating: 4.9,
        established: 1969,
        coordinates: { lat: 17.0421, lng: 74.2612 }
      },
      {
        name: 'Bhima SSK',
        district: 'Solapur',
        taluka: 'Pandharpur',
        fullAddress: 'Takali Sikandar, Pandharpur, Solapur, Maharashtra 413304',
        contact: '02186-224455',
        isOpen: true,
        frpRate: 3000,
        capacity: '4000 T/D',
        rating: 4.2,
        established: 1980,
        coordinates: { lat: 17.6775, lng: 75.3236 }
      },
      {
        name: 'Vitthal SSK',
        district: 'Solapur',
        taluka: 'Pandharpur',
        fullAddress: 'Venunagar, Gursale, Pandharpur, Solapur, Maharashtra 413304',
        contact: '02186-223456',
        isOpen: true,
        frpRate: 3050,
        capacity: '4500 T/D',
        rating: 4.6,
        established: 1978,
        coordinates: { lat: 17.7286, lng: 75.2533 }
      },
      {
        name: 'Someshwar SSK',
        district: 'Pune',
        taluka: 'Baramati',
        fullAddress: 'Someshwarnagar, Baramati, Pune, Maharashtra 412306',
        contact: '02112-282123',
        isOpen: true,
        frpRate: 3120,
        capacity: '5500 T/D',
        rating: 4.8,
        established: 1959,
        coordinates: { lat: 18.0664, lng: 74.4534 }
      },
      {
        name: 'Malegaon SSK',
        district: 'Pune',
        taluka: 'Baramati',
        fullAddress: 'Shivnagar, Baramati, Pune, Maharashtra 413116',
        contact: '02112-254567',
        isOpen: true,
        frpRate: 3250,
        capacity: '6000 T/D',
        rating: 4.7,
        established: 1957,
        coordinates: { lat: 18.1254, lng: 74.5265 }
      },
      {
        name: 'Kopargaon SSK',
        district: 'Ahmednagar',
        taluka: 'Kopargaon',
        fullAddress: 'Gautamnagar, Kolpewadi, Kopargaon, Ahmednagar, Maharashtra 423602',
        contact: '02423-222345',
        isOpen: true,
        frpRate: 3050,
        capacity: '4000 T/D',
        rating: 4.4,
        established: 1953,
        coordinates: { lat: 19.8853, lng: 74.4754 }
      },
      {
        name: 'Sanjivani Takli SSK',
        district: 'Ahmednagar',
        taluka: 'Kopargaon',
        fullAddress: 'Sahajanandnagar, Kopargaon, Ahmednagar, Maharashtra 423603',
        contact: '02423-223456',
        isOpen: true,
        frpRate: 3100,
        capacity: '5000 T/D',
        rating: 4.6,
        established: 1963,
        coordinates: { lat: 19.8653, lng: 74.5012 }
      },
      {
        name: 'Jawahar Shetkari SSK',
        district: 'Kolhapur',
        taluka: 'Hatkanangale',
        fullAddress: 'Hupari, Hatkanangale, Kolhapur, Maharashtra 416203',
        contact: '0230-2450123',
        isOpen: true,
        frpRate: 3350,
        capacity: '8000 T/D',
        rating: 4.9,
        established: 1989,
        coordinates: { lat: 16.6342, lng: 74.3411 }
      },
      {
        name: 'Datta Shetkari SSK',
        district: 'Kolhapur',
        taluka: 'Shirol',
        fullAddress: 'Dattanagar, Shirol, Kolhapur, Maharashtra 416120',
        contact: '02322-225678',
        isOpen: true,
        frpRate: 3400,
        capacity: '7000 T/D',
        rating: 4.8,
        established: 1970,
        coordinates: { lat: 16.7356, lng: 74.6054 }
      },
      {
        name: 'Panchganga SSK',
        district: 'Kolhapur',
        taluka: 'Hatkanangale',
        fullAddress: 'Ganganagar, Ichalkaranji, Kolhapur, Maharashtra 416116',
        contact: '0230-2445566',
        isOpen: true,
        frpRate: 3250,
        capacity: '5000 T/D',
        rating: 4.5,
        established: 1959,
        coordinates: { lat: 16.7022, lng: 74.4533 }
      },
      {
        name: 'Bhogawati SSK',
        district: 'Kolhapur',
        taluka: 'Karvir',
        fullAddress: 'Shahunanagar, Parite, Karvir, Kolhapur, Maharashtra 416211',
        contact: '02328-222345',
        isOpen: true,
        frpRate: 3100,
        capacity: '4000 T/D',
        rating: 4.3,
        established: 1955,
        coordinates: { lat: 16.6111, lng: 74.1522 }
      },
      {
        name: 'Warna SSK',
        district: 'Kolhapur',
        taluka: 'Panhala',
        fullAddress: 'Warnanagar, Panhala, Kolhapur, Maharashtra 416113',
        contact: '02328-224567',
        isOpen: true,
        frpRate: 3300,
        capacity: '6000 T/D',
        rating: 4.8,
        established: 1959,
        coordinates: { lat: 16.8456, lng: 74.2011 }
      },
      {
        name: 'Vighnahar SSK',
        district: 'Pune',
        taluka: 'Junnar',
        fullAddress: 'Nivruttinagar, Junnar, Pune, Maharashtra 410502',
        contact: '02132-232345',
        isOpen: true,
        frpRate: 3150,
        capacity: '4000 T/D',
        rating: 4.5,
        established: 1980,
        coordinates: { lat: 19.1866, lng: 73.9161 }
      },
      {
        name: 'Bhaurao Chavan SSK',
        district: 'Nanded',
        taluka: 'Ardhapur',
        fullAddress: 'Laxminagar, Ardhapur, Nanded, Maharashtra 431704',
        contact: '02462-243567',
        isOpen: true,
        frpRate: 2900,
        capacity: '3500 T/D',
        rating: 4.2,
        established: 1990,
        coordinates: { lat: 19.2675, lng: 77.3821 }
      },
      {
        name: 'Manjara Shetkari SSK',
        district: 'Latur',
        taluka: 'Latur',
        fullAddress: 'Vilasnagar, Latur, Maharashtra 413531',
        contact: '02382-224455',
        isOpen: true,
        frpRate: 2950,
        capacity: '4500 T/D',
        rating: 4.6,
        established: 1988,
        coordinates: { lat: 18.3986, lng: 76.5772 }
      },
      {
        name: 'Vilas SSK',
        district: 'Latur',
        taluka: 'Latur',
        fullAddress: 'Nivlinagar, Latur, Maharashtra 413512',
        contact: '02382-225566',
        isOpen: true,
        frpRate: 2950,
        capacity: '4000 T/D',
        rating: 4.4,
        established: 2000,
        coordinates: { lat: 18.4234, lng: 76.5543 }
      },
      {
        name: 'Sant Tukaram SSK',
        district: 'Pune',
        taluka: 'Mulshi',
        fullAddress: 'Kasar Amboli, Mulshi, Pune, Maharashtra 412108',
        contact: '020-2292345',
        isOpen: true,
        frpRate: 3100,
        capacity: '3500 T/D',
        rating: 4.3,
        established: 1995,
        coordinates: { lat: 18.5283, lng: 73.6934 }
      },
      {
        name: 'Sanjivani SSK',
        district: 'Solapur',
        taluka: 'Mangalvedha',
        fullAddress: 'Mangalvedha, Solapur, Maharashtra 413305',
        contact: '02188-220123',
        isOpen: true,
        frpRate: 3000,
        capacity: '3000 T/D',
        rating: 4.1,
        established: 1985,
        coordinates: { lat: 17.5146, lng: 75.4411 }
      },
      {
        name: 'Dr. Patangrao Kadam Sonhira SSK',
        district: 'Sangli',
        taluka: 'Kadegaon',
        fullAddress: 'Mohanrao Kadam Nagar, Wangi, Kadegaon, Sangli 415305',
        contact: '02347-224567',
        isOpen: true,
        frpRate: 3200,
        capacity: '5000 T/D',
        rating: 4.7,
        established: 1999,
        coordinates: { lat: 17.2944, lng: 74.3211 }
      },
      {
        name: 'Krantiagrani Dr. G.D. Bapu Lad SSK',
        district: 'Sangli',
        taluka: 'Palus',
        fullAddress: 'Kundal, Palus, Sangli, Maharashtra 416309',
        contact: '02346-224455',
        isOpen: true,
        frpRate: 3150,
        capacity: '4500 T/D',
        rating: 4.6,
        established: 2000,
        coordinates: { lat: 17.0864, lng: 74.4172 }
      },
      {
        name: 'Utopia SSK',
        district: 'Sangli',
        taluka: 'Kavathe Mahankal',
        fullAddress: 'Utopia Nagar, Kavathe Mahankal, Sangli 416405',
        contact: '02341-222345',
        isOpen: true,
        frpRate: 3050,
        capacity: '3500 T/D',
        rating: 4.2,
        established: 2005,
        coordinates: { lat: 17.0211, lng: 74.8361 }
      },
      {
        name: 'Shri Datta Shetkari SSK',
        district: 'Satara',
        taluka: 'Khatav',
        fullAddress: 'Dattanagar, Khatav, Satara 415505',
        contact: '02161-224567',
        isOpen: true,
        frpRate: 2950,
        capacity: '3000 T/D',
        rating: 4.1,
        established: 1992,
        coordinates: { lat: 17.6521, lng: 74.3721 }
      },
      {
        name: 'Shri Renuka Sugars Ltd',
        district: 'Pune',
        taluka: 'Indapur',
        fullAddress: 'Indapur, Pune 413106',
        contact: '02111-223456',
        isOpen: true,
        frpRate: 3250,
        capacity: '7000 T/D',
        rating: 4.8,
        established: 2001,
        coordinates: { lat: 18.1154, lng: 75.0211 }
      },
      {
        name: 'Natural Sugar and Allied Industries',
        district: 'Osmanabad',
        taluka: 'Kalamb',
        fullAddress: 'Ranjani, Kalamb, Osmanabad 413528',
        contact: '02473-222345',
        isOpen: true,
        frpRate: 2950,
        capacity: '3500 T/D',
        rating: 4.5,
        established: 2000,
        coordinates: { lat: 18.4111, lng: 75.9122 }
      },
      {
        name: 'Vikas SSK',
        district: 'Latur',
        taluka: 'Nilanga',
        fullAddress: 'Nilanga, Latur 413521',
        contact: '02384-224455',
        isOpen: true,
        frpRate: 2900,
        capacity: '3000 T/D',
        rating: 4.2,
        established: 1998,
        coordinates: { lat: 18.1065, lng: 76.7583 }
      },
      {
        name: 'Shree Tatyasaheb Kore Warna SSK',
        district: 'Kolhapur',
        taluka: 'Panhala',
        fullAddress: 'Warnanagar, Panhala, Kolhapur 416113',
        contact: '02328-224455',
        isOpen: true,
        frpRate: 3300,
        capacity: '6000 T/D',
        rating: 4.9,
        established: 1955,
        coordinates: { lat: 16.8455, lng: 74.2012 }
      },
      {
        name: 'Bhima SSK Ltd.',
        district: 'Pune',
        taluka: 'Daund',
        fullAddress: 'Patas, Daund, Pune 412219',
        contact: '02117-222345',
        isOpen: true,
        frpRate: 3050,
        capacity: '4000 T/D',
        rating: 4.4,
        established: 1980,
        coordinates: { lat: 18.4211, lng: 74.5211 }
      }
    ];

    await Factory.insertMany(factories);
    console.log(`✅ ${factories.length} Real Factories seeded successfully!`);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedFactories();
