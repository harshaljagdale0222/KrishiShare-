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
        location: 'Yashwantnagar, Satara',
        contact: '02162-234567',
        status: 'Active',
        capacity: '5000 T/D',
        manager: 'S. Patil'
      },
      {
        name: 'Krishna Sahakari Sakhar Karkhana',
        location: 'Rethare Bk, Karad',
        contact: '02164-245678',
        status: 'Active',
        capacity: '7500 T/D',
        manager: 'V. Mohite'
      },
      {
        name: 'Vasantdada Patil SSK',
        location: 'Sangli',
        contact: '0233-2310123',
        status: 'Maintenance',
        capacity: '4500 T/D',
        manager: 'A. Deshmukh'
      }
    ];

    await Factory.insertMany(factories);
    console.log('✅ Factories seeded successfully!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedFactories();
