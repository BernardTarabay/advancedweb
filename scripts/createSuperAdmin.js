const mongoose = require('mongoose');
const User = require('../models/User');

// Load from .env file in parent directory
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const createSuperAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('MONGODB_URI is not defined in .env file');
      console.log('Make sure .env file exists in project root');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'super admin' });
    
    if (existingSuperAdmin) {
      console.log('Super admin already exists:', existingSuperAdmin.email);
      process.exit(0);
    }

    // Use env variables or defaults
    const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';

    // Create super admin
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: email,
      password: password,
      role: 'super admin'
    });

    console.log('Super admin created successfully!');
    console.log('Email:', superAdmin.email);
    console.log('Password:', password);
    console.log('\n⚠️  CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating super admin:', error);
    process.exit(1);
  }
};

createSuperAdmin();