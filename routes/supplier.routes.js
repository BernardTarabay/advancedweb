const express = require('express');
const router = express.Router();

const supplierController = require('../controllers/supplierController');
const { protect } = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');

router.get('/', protect, requireRole('manager', 'admin'), supplierController.getAllSuppliers);
router.get('/new', protect, requireRole('admin'), supplierController.showCreateForm);
router.get('/:id', protect, requireRole('manager', 'admin'), supplierController.getSupplierById);
router.get('/:id/edit', protect, requireRole('admin'), supplierController.showEditForm);

router.post('/create', protect, requireRole('admin'), supplierController.createSupplier);
router.post('/:id/update', protect, requireRole('admin'), supplierController.updateSupplier);
router.post('/:id/delete', protect, requireRole('admin'), supplierController.deleteSupplier);

module.exports = router;