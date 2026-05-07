const mongoose = require('mongoose');
const dotenv = require('dotenv');

// We need to register the model first
const Equipment = require('./models/Equipment');

const testDB = async () => {
  try {
    dotenv.config();
    console.log('Connecting to:', process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected!');
    
    const count = await Equipment.countDocuments();
    console.log('Equipment count (using app model):', count);
    
    const data = await Equipment.find().sort({ rating: -1 });
    console.log('Data sample:', data.map(d => d.name));
    
    process.exit(0);
  } catch (err) {
    console.error('❌ App Model Test failed:', err);
    process.exit(1);
  }
};

testDB();
