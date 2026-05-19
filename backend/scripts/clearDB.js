const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// .env फाईल लोड करण्यासाठी
dotenv.config({ path: path.join(__dirname, '../.env') });

const clearDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/krishi-share';

  try {
    console.log('🔄 MongoDB शी कनेक्ट होत आहे...');
    await mongoose.connect(uri);
    console.log('✅ कनेक्शन यशस्वी!');

    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    console.log(`🧹 एकूण ${collectionNames.length} कलेक्शन्स सापडले. डेटा साफ करत आहे...`);

    for (const name of collectionNames) {
      await mongoose.connection.db.collection(name).deleteMany({});
      console.log(`- ${name} मधील डेटा साफ केला.`);
    }

    console.log('\n✨ अभिनंदन! तुमचा सर्व डेटा सुरक्षितपणे डिलीट झाला आहे. 🚀');
    console.log('आता तुम्ही फ्रेश सुरुवात करू शकता.');

    process.exit(0);
  } catch (error) {
    console.error('❌ चूक झाली:', error.message);
    process.exit(1);
  }
};

clearDB();
