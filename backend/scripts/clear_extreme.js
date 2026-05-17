const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

const clearBothDBs = async () => {
  const dbNames = ['krishishare', 'krishi-share'];
  const baseUri = "mongodb://harshaljagdale40_db_user:Harshal770222@ac-icjfoeu-shard-00-00.ddhzlo2.mongodb.net:27017,ac-icjfoeu-shard-00-01.ddhzlo2.mongodb.net:27017,ac-icjfoeu-shard-00-02.ddhzlo2.mongodb.net:27017/";
  const options = "?ssl=true&authSource=admin&retryWrites=true&w=majority";

  for (const name of dbNames) {
    try {
      console.log(`🔄 Connecting to database: ${name}...`);
      const uri = `${baseUri}${name}${options}`;
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
