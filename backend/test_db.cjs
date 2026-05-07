const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const testDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected!');
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const names = collections.map(c => c.name);
    console.log('Collections:', names);
    
    for (const name of names) {
      const count = await mongoose.connection.db.collection(name).countDocuments();
      console.log(`- ${name}: ${count}`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
};

testDB();
