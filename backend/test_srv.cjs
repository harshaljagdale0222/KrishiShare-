const mongoose = require('mongoose');
const dotenv = require('dotenv');

const testDB = async () => {
  try {
    const srvUri = 'mongodb+srv://harshaljagdale40_db_user:Harshal2025@ac-icjfoeu.ddhzlo2.mongodb.net/krishishare?retryWrites=true&w=majority';
    console.log('Connecting to SRV:', srvUri);
    await mongoose.connect(srvUri);
    console.log('✅ Connected via SRV!');
    
    // Count equipments
    const Equipment = mongoose.model('Equipment', new mongoose.Schema({ name: String }, { strict: false, collection: 'equipment' }));
    const count = await Equipment.countDocuments();
    console.log('Equipment count (equipment collection):', count);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ SRV Test failed:', err);
    process.exit(1);
  }
};

testDB();
