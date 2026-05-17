const mongoose = require('mongoose');
const Factory = require('../models/Factory');
require('dotenv').config({ path: '.env' });
const fs = require('fs');

const fileData = fs.readFileSync('../src/utils/locationData.js', 'utf8');
const dataStr = fileData.replace('export const maharashtraData = ', '').replace(';', '');
const maharashtraData = eval('(' + dataStr + ')');

const districtCoords = {
  'Ahmednagar': {lat: 19.0952, lng: 74.7496}, 'Akola': {lat: 20.7059, lng: 77.0082},
  'Amravati': {lat: 20.9320, lng: 77.7523}, 'Aurangabad': {lat: 19.8762, lng: 75.3433},
  'Beed': {lat: 18.9891, lng: 75.7601}, 'Bhandara': {lat: 21.1777, lng: 79.6569},
  'Buldhana': {lat: 20.5315, lng: 76.1838}, 'Chandrapur': {lat: 19.9615, lng: 79.2961},
  'Dhule': {lat: 20.9042, lng: 74.7749}, 'Gadchiroli': {lat: 20.1849, lng: 79.9948},
  'Gondia': {lat: 21.4624, lng: 80.1960}, 'Hingoli': {lat: 19.7156, lng: 77.1438},
  'Jalgaon': {lat: 21.0077, lng: 75.5626}, 'Jalna': {lat: 19.8297, lng: 75.8800},
  'Kolhapur': {lat: 16.7050, lng: 74.2433}, 'Latur': {lat: 18.4088, lng: 76.5604},
  'Mumbai City': {lat: 18.9750, lng: 72.8258}, 'Mumbai Suburban': {lat: 19.1136, lng: 72.8697},
  'Nagpur': {lat: 21.1458, lng: 79.0882}, 'Nanded': {lat: 19.1383, lng: 77.3210},
  'Nandurbar': {lat: 21.3736, lng: 74.2415}, 'Nashik': {lat: 20.0110, lng: 73.7903},
  'Osmanabad': {lat: 18.1856, lng: 76.0419}, 'Palghar': {lat: 19.6966, lng: 72.7699},
  'Parbhani': {lat: 19.2644, lng: 76.6413}, 'Pune': {lat: 18.5204, lng: 73.8567},
  'Raigad': {lat: 18.6396, lng: 72.9806}, 'Ratnagiri': {lat: 16.9902, lng: 73.3120},
  'Sangli': {lat: 16.8524, lng: 74.5815}, 'Satara': {lat: 17.6805, lng: 74.0183},
  'Sindhudurg': {lat: 16.1092, lng: 73.8219}, 'Solapur': {lat: 17.6599, lng: 75.9064},
  'Thane': {lat: 19.2183, lng: 72.9781}, 'Wardha': {lat: 20.7453, lng: 78.6022},
  'Washim': {lat: 20.1065, lng: 77.1477}, 'Yavatmal': {lat: 20.3888, lng: 78.1204}
};

let factories = [];
for (const dist in maharashtraData) {
  const tals = maharashtraData[dist].talukas || [];
  const baseCoord = districtCoords[dist] || {lat: 18.5204, lng: 73.8567};

  tals.forEach(tal => {
    const latOffset = (Math.random() - 0.5) * 0.4;
    const lngOffset = (Math.random() - 0.5) * 0.4;
    
    factories.push({
      name: tal.en + ' Cooperative Sugar Factory Ltd.',
      district: dist,
      taluka: tal.en,
      fullAddress: 'Main Road, ' + tal.en + ', ' + dist + ', Maharashtra',
      contact: '020-' + Math.floor(1000000 + Math.random() * 9000000),
      isOpen: Math.random() > 0.1,
      frpRate: Math.floor(2500 + Math.random() * 1000),
      capacity: Math.floor(2000 + Math.random() * 5000) + ' T/D',
      rating: parseFloat((3 + Math.random() * 2).toFixed(1)),
      established: 1960 + Math.floor(Math.random() * 50),
      coordinates: { lat: baseCoord.lat + latOffset, lng: baseCoord.lng + lngOffset }
    });
  });
}

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    await Factory.deleteMany({ name: { $regex: 'Cooperative Sugar Factory Ltd.' } });
    await Factory.insertMany(factories);
    console.log('✅ Seeded ' + factories.length + ' taluka factories into DB!');
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
};
seed();
