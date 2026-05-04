/**
 * Seed script – populates the database with demo data.
 * Run: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Collector = require('./models/Collector');
const Recycler = require('./models/Recycler');
const Request = require('./models/Request');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Collector.deleteMany({}),
    Recycler.deleteMany({}),
    Request.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // Create users
  const passwordHash = await bcrypt.hash('123456', 12);

  const [admin, user1, col1, col2, rec1] = await User.insertMany([
    {
      name: 'Admin User',
      email: 'admin@test.com',
      password: passwordHash,
      role: 'admin',
      phone: '9876543210',
      isActive: true,
      location: { type: 'Point', coordinates: [77.2090, 28.6139] },
    },
    {
      name: 'Rahul Kumar',
      email: 'user@test.com',
      password: passwordHash,
      role: 'user',
      phone: '9876543211',
      address: 'Sector 15, Noida, UP',
      isActive: true,
      location: { type: 'Point', coordinates: [77.3910, 28.5355] },
    },
    {
      name: 'Suresh Yadav',
      email: 'collector@test.com',
      password: passwordHash,
      role: 'collector',
      phone: '9876543212',
      isActive: true,
      location: { type: 'Point', coordinates: [77.2300, 28.6200] },
    },
    {
      name: 'Ramesh Kabadi',
      email: 'collector2@test.com',
      password: passwordHash,
      role: 'collector',
      phone: '9876543213',
      isActive: true,
      location: { type: 'Point', coordinates: [77.1800, 28.6400] },
    },
    {
      name: 'GreenCycle Pvt Ltd',
      email: 'recycler@test.com',
      password: passwordHash,
      role: 'recycler',
      phone: '9876543214',
      isActive: true,
      location: { type: 'Point', coordinates: [77.2500, 28.5900] },
    },
  ]);

  console.log('Users created');

  // Create collector profiles
  await Collector.insertMany([
    {
      userId: col1._id,
      vehicleType: 'tempo',
      vehicleNumber: 'DL01AB1234',
      isAvailable: true,
      isVerified: true,
      rating: 4.7,
      totalRatings: 84,
      completedPickups: 84,
      currentLocation: { type: 'Point', coordinates: [77.2300, 28.6200] },
      acceptedScrapTypes: ['Paper', 'Plastic', 'Metal', 'Electronics', 'Appliances', 'Glass', 'Mixed'],
    },
    {
      userId: col2._id,
      vehicleType: 'rickshaw',
      vehicleNumber: 'DL02CD5678',
      isAvailable: true,
      isVerified: true,
      rating: 4.3,
      totalRatings: 52,
      completedPickups: 52,
      currentLocation: { type: 'Point', coordinates: [77.1800, 28.6400] },
      acceptedScrapTypes: ['Paper', 'Plastic', 'Glass', 'Mixed'],
    },
  ]);

  console.log('Collector profiles created');

  // Create recyclers
  await Recycler.insertMany([
    {
      name: 'Delhi Paper Mills',
      contactPerson: 'Anil Gupta',
      email: 'paper@recycler.com',
      phone: '9800000001',
      address: 'Industrial Area, Phase 2, Delhi',
      location: { type: 'Point', coordinates: [77.1500, 28.7000] },
      supportedScrapTypes: ['Paper'],
      recyclerType: 'Paper Recycling Unit',
      maxCapacity: 5000,
      currentCapacity: 1200,
      isActive: true,
      isVerified: true,
      userId: rec1._id,
    },
    {
      name: 'PlasTech Recyclers',
      contactPerson: 'Vijay Singh',
      email: 'plastic@recycler.com',
      phone: '9800000002',
      address: 'Sector 63, Noida, UP',
      location: { type: 'Point', coordinates: [77.3700, 28.5900] },
      supportedScrapTypes: ['Plastic'],
      recyclerType: 'Plastic Processing Plant',
      maxCapacity: 3000,
      currentCapacity: 800,
      isActive: true,
      isVerified: true,
    },
    {
      name: 'SteelKraft Scrap Yard',
      contactPerson: 'Harish Mehta',
      email: 'metal@recycler.com',
      phone: '9800000003',
      address: 'Wazirpur Industrial Area, Delhi',
      location: { type: 'Point', coordinates: [77.1800, 28.6900] },
      supportedScrapTypes: ['Metal', 'Appliances'],
      recyclerType: 'Metal Scrap Yard',
      maxCapacity: 10000,
      currentCapacity: 3500,
      isActive: true,
      isVerified: true,
    },
    {
      name: 'E-Waste Solutions India',
      contactPerson: 'Priya Nair',
      email: 'ewaste@recycler.com',
      phone: '9800000004',
      address: 'Okhla Phase III, Delhi',
      location: { type: 'Point', coordinates: [77.2700, 28.5500] },
      supportedScrapTypes: ['Electronics'],
      recyclerType: 'E-waste Facility',
      maxCapacity: 2000,
      currentCapacity: 400,
      isActive: true,
      isVerified: true,
    },
    {
      name: 'GreenSync General Recycling',
      contactPerson: 'Aman Sharma',
      email: 'general@recycler.com',
      phone: '9800000005',
      address: 'Naraina Industrial Area, Delhi',
      location: { type: 'Point', coordinates: [77.1400, 28.6300] },
      supportedScrapTypes: ['Paper', 'Plastic', 'Metal', 'Electronics', 'Appliances', 'Glass', 'Mixed'],
      recyclerType: 'General',
      maxCapacity: 8000,
      currentCapacity: 2000,
      isActive: true,
      isVerified: true,
    },
  ]);

  console.log('Recyclers created');

  // Create sample requests
  await Request.insertMany([
    {
      userId: user1._id,
      collectorId: col1._id,
      scrapType: 'Paper',
      estimatedWeight: 25,
      actualWeight: 23,
      address: 'Sector 15, Noida, UP 201301',
      location: { type: 'Point', coordinates: [77.3910, 28.5355] },
      scheduledDate: new Date('2026-04-05'),
      scheduledTime: '09:00 - 11:00',
      status: 'completed',
      estimatedPrice: 200,
      finalPrice: 184,
      statusHistory: [
        { status: 'pending', note: 'Request created' },
        { status: 'assigned', note: 'Collector assigned' },
        { status: 'out_for_pickup', note: 'Collector heading to location' },
        { status: 'picked_up', note: 'Picked up 23kg' },
        { status: 'in_transit', note: 'Routed to Paper Mills' },
        { status: 'delivered', note: 'Delivered to recycler' },
        { status: 'completed', note: 'Processing complete' },
      ],
      completedAt: new Date(),
    },
    {
      userId: user1._id,
      scrapType: 'Metal',
      estimatedWeight: 15,
      address: 'Sector 15, Noida, UP 201301',
      location: { type: 'Point', coordinates: [77.3910, 28.5355] },
      scheduledDate: new Date('2026-04-10'),
      scheduledTime: '11:00 - 13:00',
      status: 'pending',
      estimatedPrice: 375,
      statusHistory: [{ status: 'pending', note: 'Request created' }],
    },
  ]);

  console.log('Sample requests created');

  console.log('\n=== SEED COMPLETE ===');
  console.log('Demo accounts (password: 123456):');
  console.log('  Admin:     admin@test.com');
  console.log('  User:      user@test.com');
  console.log('  Collector: collector@test.com');
  console.log('  Collector: collector2@test.com');
  console.log('  Recycler:  recycler@test.com');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
