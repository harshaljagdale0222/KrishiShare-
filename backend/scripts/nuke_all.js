const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

const nukeEverything = async () => {
  const uri = "mongodb://harshaljagdale40_db_user:Harshal770222@ac-icjfoeu-shard-00-00.ddhzlo2.mongodb.net:27017,ac-icjfoeu-shard-00-01.ddhzlo2.mongodb.net:27017,ac-icjfoeu-shard-00-02.ddhzlo2.mongodb.net:27017/?ssl=true&authSource=admin&retryWrites=true&w=majority";

  try {
    console.log('🚀 Connecting to Cluster...');
    const conn = await mongoose.connect(uri);
    
    // Get all databases using the native driver
    const adminDb = mongoose.connection.client.db().admin();
    const dbs = await adminDb.listDatabases();
    const targetDbs = dbs.databases.map(db => db.name).filter(name => !['admin', 'local', 'config', 'sample_mflix'].includes(name));

    console.log('📂 Found databases to clean:', targetDbs);

    for (const dbName of targetDbs) {
      console.log(`\n🧹 Cleaning database: ${dbName}...`);
      const db = mongoose.connection.client.db(dbName);
      const collections = await db.listCollections().toArray();
      
      for (const col of collections) {
        console.log(`🗑️ Deleting collection: ${dbName}.${col.name}`);
        await db.collection(col.name).deleteMany({});
      }
    }

    console.log('\n✨ MISSION ACCOMPLISHED! EVERYTHING IS PURGED.');
    process.exit(0);
  } catch (err) {
    console.error('❌ CRITICAL ERROR:', err);
    process.exit(1);
  }
};

nukeEverything();
