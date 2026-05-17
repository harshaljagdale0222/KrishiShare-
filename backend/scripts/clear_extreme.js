const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

const clearBothDBs = async () => {
  const dbNames = ['krishishare', 'krishi-share'];
  const baseUri = process.env.MONGO_URI || "mongodb://localhost:27017";

  for (const name of dbNames) {
    try {
      console.log(`🔄 Connecting to database: ${name}...`);
      // Re-use connection string but specify DB name if it's a localhost URI, otherwise just connect with env.
      const uri = baseUri.includes('?') ? baseUri.replace(/\/\?/, `/${name}?`) : `${baseUri}/${name}`;
      const conn = await mongoose.connect(uri);
      
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        console.log(`🗑️ Clearing ${name} -> collection: ${key}`);
        await collections[key].deleteMany({});
      }
      await mongoose.disconnect();
      console.log(`✅ ${name} cleaned!`);
    } catch (err) {
      console.error(`❌ Error clearing ${name}:`, err.message);
    }
  }
  process.exit(0);
};

clearBothDBs();
