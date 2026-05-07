const User = require('../models/User');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../middleware/asyncHandler');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

const setCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  });
};

exports.showRegister = asyncHandler(async (req, res) => {
  res.render('register', { error: null });
});

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.render('register', { error: 'Please provide all required fields' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.render('register', { error: 'Email already exists' });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: 'customer' // Default role
  });

  res.redirect('/auth/login');
});

exports.registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !['admin', 'manager'].includes(role)) {
    return res.status(400).json({ message: 'Invalid input or role' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'Email already exists' });
  }

  const user = await User.create({
    name,
    email,
    password,
    role
  });

  res.status(201).json({ message: 'Admin created successfully' });
});

exports.showLogin = asyncHandler(async (req, res) => {
  res.render('login', { error: null });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('login', { error: 'Please provide email and password' });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.render('login', { error: 'Invalid credentials' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.render('login', { error: 'Invalid credentials' });
  }

  const token = generateToken(user);
  setCookie(res, token);

  if (user.role === 'super admin') {
    return res.redirect('/admin-dashboard');
  }

  res.redirect('/products');
});

exports.loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('login', { error: 'Please provide email and password' });
  }

  const user = await User.findOne({ email, role: { $in: ['admin', 'super admin'] } });
  if (!user) {
    return res.render('login', { error: 'Invalid credentials or not an admin' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.render('login', { error: 'Invalid credentials' });
  }

  const token = generateToken(user);
  setCookie(res, token);

  res.redirect('/admin-dashboard');
});

exports.logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', {
    
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.redirect('/auth/login');
});