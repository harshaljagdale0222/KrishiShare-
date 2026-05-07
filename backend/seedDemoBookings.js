const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Order = require('./models/Order');
const User = require('./models/User');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/krishi-share');
    
    // Find a farmer user to assign bookings to
    const farmer = await User.findOne({ role: 'farmer' }) || await User.findOne();
    if (!farmer) {
        console.log("No user found. Please register first.");
        process.exit();
    }

    const userId = farmer._id;

    const demoBookings = [
      {
        farmerId: userId,
        equipmentId: new mongoose.Types.ObjectId(),
        equipmentName: "John Deere 5310 Tractor",
        owner: "Sanjay Patil",
        ownerPhone: "9876543210",
        date: new Date(),
        timeSlot: "09:00 AM - 12:00 PM",
        hours: 3,
        amount: 2500,
        status: "completed",
        location: "Pune, Maharashtra",
        category: "tractor"
      },
      {
        farmerId: userId,
        equipmentId: new mongoose.Types.ObjectId(),
        equipmentName: "Mahindra Rice Harvester",
        owner: "Rahul Deshmukh",
        ownerPhone: "9123456789",
        date: new Date(Date.now() - 86400000), // Yesterday
        timeSlot: "02:00 PM - 06:00 PM",
        hours: 4,
        amount: 4500,
        status: "confirmed",
        location: "Satara, Maharashtra",
        category: "harvester"
      },
      {
        farmerId: userId,
        equipmentId: new mongoose.Types.ObjectId(),
        equipmentName: "Rotavator (Heavy Duty)",
        owner: "Vikas Shinde",
        ownerPhone: "9988776655",
        date: new Date(Date.now() + 86400000), // Tomorrow
        timeSlot: "10:00 AM - 01:00 PM",
        hours: 3,
        amount: 1800,
        status: "pending",
        location: "Pune, Maharashtra",
        category: "tractor"
      }
    ];

    await Booking.deleteMany({ farmerId: userId });
    await Booking.insertMany(demoBookings);

    console.log("✅ 3 Demo Bookings Added for User: " + farmer.name);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedData();
