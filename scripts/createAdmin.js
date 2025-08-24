const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'superadmin' });
    if (existingAdmin) {
      console.log('Superadmin already exists');
      process.exit(0);
    }

    // Create superadmin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = new User({
      username: 'admin',
      email: 'admin@interiordesign.com',
      password: hashedPassword,
      role: 'superadmin',
      permissions: ['all'],
      isActive: true
    });

    await adminUser.save();
    console.log('✅ Superadmin user created successfully!');
    console.log('📧 Email: admin@interiordesign.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdminUser(); 
