const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password');

  res.render('users', {
    users,
    user: req.user,
    success: null
  });
});

exports.getUserById = asyncHandler(async (req, res) => {
  const viewUser = await User.findById(req.params.id).select('-password');

  if (!viewUser) {
    return res.redirect('/users');
  }

  res.render('user-detail', {
    viewUser,
    user: req.user
  });
});

exports.showCreateForm = asyncHandler(async (req, res) => {
  res.render('user-form', {
    isEdit: false,
    editUser: null,
    user: req.user,
    error: null,
    roleLocked: false
  });
});

exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.render('user-form', {
      isEdit: false,
      editUser: null,
      user: req.user,
      error: 'All fields are required',
      roleLocked: false
    });
  }

  // Validate role - super admin can create admins, regular admin cannot
  const allowedRoles = req.user.role === 'super admin' 
    ? ['customer', 'manager', 'admin']
    : ['customer', 'manager'];

  if (role && !allowedRoles.includes(role)) {
    return res.render('user-form', {
      isEdit: false,
      editUser: null,
      user: req.user,
      error: 'You do not have permission to create users with that role',
      roleLocked: false
    });
  }

  const existing = await User.findOne({ email });

  if (existing) {
    return res.render('user-form', {
      isEdit: false,
      editUser: null,
      user: req.user,
      error: 'User with this email already exists',
      roleLocked: false
    });
  }

  const newUser = await User.create({
    name,
    email,
    password,
    role: role || 'customer'
  });

  res.redirect('/users');
});

exports.showEditForm = asyncHandler(async (req, res) => {
  const editUser = await User.findById(req.params.id).select('-password');

  if (!editUser) {
    return res.redirect('/users');
  }

  if (editUser.role === 'super admin' && req.user.role !== 'super admin') {
    return res.redirect('/users');
  }

  const roleLocked =
    req.user.role !== 'super admin' &&
    (editUser.role === 'admin' || editUser.role === 'super admin');

  res.render('user-form', {
    isEdit: true,
    editUser,
    user: req.user,
    error: null,
    roleLocked
  });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const targetUser = await User.findById(req.params.id);

  if (!targetUser) {
    return res.redirect('/users');
  }

  if (targetUser.role === 'super admin' && req.user.role !== 'super admin') {
    return res.redirect('/users');
  }

  const { password, role, ...updateData } = req.body;

  const roleLocked =
    req.user.role !== 'super admin' &&
    (targetUser.role === 'admin' || targetUser.role === 'super admin');

  if (role && !roleLocked) {
    const allowedRoles =
      req.user.role === 'super admin'
        ? ['customer', 'manager', 'admin']
        : ['customer', 'manager'];

    if (!allowedRoles.includes(role)) {
      return res.redirect('/users/' + req.params.id + '?error=insufficient_permissions');
    }
    updateData.role = role;
  }

  if (password) {
    updateData.password = password;
  }

  if (String(req.params.id) === String(req.user._id) && req.user.role === 'super admin') {
    delete updateData.role;
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  if (!updatedUser) {
    return res.redirect('/users');
  }

  res.redirect('/users/' + updatedUser._id);
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);

  if (!target) {
    return res.redirect('/users');
  }

  if (target.role === 'super admin') {
    return res.redirect('/users');
  }

  await User.findByIdAndDelete(req.params.id);

  res.redirect('/users');
});