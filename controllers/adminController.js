const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

exports.showAdminDashboard = asyncHandler(async (req, res) => {
  // Get all users for super admin to manage
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  
  // Count users by role
  const stats = {
    totalUsers: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    managers: users.filter(u => u.role === 'manager').length,
    customers: users.filter(u => u.role === 'customer').length,
    superAdmins: users.filter(u => u.role === 'super admin').length
  };

  res.render('admin-dashboard', {
    user: req.user,
    users,
    stats,
    success: req.query.success || null
  });
});

exports.grantAdminRole = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;

  // Only super admin can grant admin roles
  if (req.user.role !== 'super admin') {
    return res.status(403).json({ message: 'Only super admin can grant admin roles' });
  }

  // Validate role
  if (!['admin', 'manager', 'customer'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  // Prevent modifying super admin roles
  const targetUser = await User.findById(userId);
  if (targetUser && targetUser.role === 'super admin') {
    return res.status(403).json({ message: 'Cannot modify a super admin.' });
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.redirect('/admin-dashboard?success=Role updated successfully');
});
