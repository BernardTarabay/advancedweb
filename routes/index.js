const express = require('express');
const router = express.Router();

// Import route modules
const userRoutes = require('./user.routes');
const productRoutes = require('./product.routes');
const supplierRoutes = require('./supplier.routes');
const orderRoutes = require('./order.routes');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');

// Root redirect
router.get('/', (req, res) => {
  res.redirect('/auth/login');
});

// Route mounting
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/orders', orderRoutes);
router.use('/auth', authRoutes);
router.use('/', adminRoutes); // Admin routes at root level

module.exports = router;