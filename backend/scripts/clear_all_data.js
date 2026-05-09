const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

const clearAllData = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      console.log(`🗑️ Clearing collection: ${key}`);
      await collections[key].deleteMany({});
    }

    console.log('✅ ALL DATA DELETED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error clearing data:', err);
    process.exit(1);
  }
};

clearAllData();
