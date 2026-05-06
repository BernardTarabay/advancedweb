const User = require('../models/User');

/**
 * If SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are set, ensure that user
 * exists with role "super admin" (create or promote). Safe to call after DB connect.
 */
async function ensureSuperAdmin() {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!superAdminEmail || !superAdminPassword) {
    console.error('Super Admin credentials are not set in environment variables.');
    return;
  }

  const existingUser = await User.findOne({ email: superAdminEmail });
  if (existingUser) {
    if (existingUser.role !== 'super admin') {
      existingUser.role = 'super admin';
      await existingUser.save();
      console.log('Existing user updated to Super Admin role.');
    }
  } else {
    await User.create({
      name: 'Super Admin',
      email: superAdminEmail,
      password: superAdminPassword,
      role: 'super admin'
    });
    console.log('Super Admin created successfully.');
  }
}

module.exports = { ensureSuperAdmin };
