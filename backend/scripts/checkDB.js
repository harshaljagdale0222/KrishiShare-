const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/krishi-share';
  const models = {
    harvestrequests: require("../models/HarvestRequest"),
    users: require("../models/User"),
    factories: require("../models/Factory"),
    bookings: require("../models/Booking"),
    factorymembers: require("../models/FactoryMember"),
    equipment: require("../models/Equipment"),
    harvestslips: require("../models/HarvestSlip"),
    notifications: require("../models/Notification"),
    complaints: require("../models/Complaint"),
    products: require("../models/Product"),
    orders: require("../models/Order"),
    schemes: require("../models/Scheme"),
  };
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('\n--- 📊 DATABASE STATUS ---');
    if (collections.length === 0) {
      console.log('डेटाबेस पूर्णपणे कोरा (Empty) आहे. एकही कलेक्शन नाही.');
    } else {
      for (let col of collections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`- Collection: ${col.name} | Documents: ${count}`);
      }
    }
    console.log('---------------------------\n');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

checkDB();
