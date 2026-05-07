
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB for cleaning...');
        
        // Use the native DB object to get ALL collections in the database
        const db = mongoose.connection.db;
        const allCollections = await db.listCollections().toArray();
        
        for (const col of allCollections) {
            const collectionName = col.name;
            await db.collection(collectionName).deleteMany({});
            console.log(`🗑️  Cleared native collection: ${collectionName}`);
        }
        
        console.log('✨ All data cleaned successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error cleaning database:', error);
        process.exit(1);
    }
};

connectDB();
