const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');

router.get('/', protect, productController.getAllProducts);
router.get('/new', protect, requireRole('admin'), productController.showCreateForm);
router.get('/:id', protect, productController.getProductById);
router.get('/:id/edit', protect, requireRole('admin'), productController.showEditForm);

router.post('/create', protect, requireRole('admin'), productController.createProduct);
router.post('/:id/update', protect, requireRole('admin'), productController.updateProduct);
router.post('/:id/delete', protect, requireRole('admin'), productController.deleteProduct);

module.exports = router;