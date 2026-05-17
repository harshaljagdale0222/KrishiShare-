const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

const nukeEverything = async () => {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/krishishare";

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
