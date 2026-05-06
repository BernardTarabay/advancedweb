const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');

router.get(
  '/',
  protect,
  requireRole('customer', 'manager', 'admin'),
  orderController.getAllOrders
);

router.get(
  '/new',
  protect,
  requireRole('customer', 'admin'),
  orderController.showCreateForm
);

router.post(
  '/create',
  protect,
  requireRole('customer', 'admin'),
  orderController.createOrder
);

router.get(
  '/:id',
  protect,
  requireRole('customer', 'manager', 'admin'),
  orderController.getOrderById
);

router.get(
  '/:id/edit',
  protect,
  requireRole('admin'),
  orderController.showUpdateForm
);

router.post(
  '/:id/update',
  protect,
  requireRole('admin'),
  orderController.updateOrder
);

router.post(
  '/:id/delete',
  protect,
  requireRole('admin'),
  orderController.deleteOrder
);

module.exports = router;

