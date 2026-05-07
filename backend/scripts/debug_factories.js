const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function run() {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        
        const User = require('../models/User');
        const Factory = require('../models/Factory');
        
        const factoriesCount = await Factory.countDocuments();
        console.log('Total Factories in collection:', factoriesCount);
        
        const factoryOwners = await User.find({ role: 'factory_owner' });
        console.log('Total User Factory Owners:', factoryOwners.length);
        
        const ownersDistricts = factoryOwners.map(u => ({ name: u.name, district: u.district }));
        console.log('Owners and their districts:', ownersDistricts);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
