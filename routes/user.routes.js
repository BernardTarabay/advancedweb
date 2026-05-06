const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');

router.get('/', protect, requireRole('manager', 'admin'), userController.getAllUsers);
router.get('/new', protect, requireRole('admin'), userController.showCreateForm);
router.get('/:id', protect, requireRole('manager', 'admin'), userController.getUserById);
router.get('/:id/edit', protect, requireRole('admin'), userController.showEditForm);

router.post('/create', protect, requireRole('admin'), userController.createUser);
router.post('/:id/update', protect, requireRole('admin'), userController.updateUser);
router.post('/:id/delete', protect, requireRole('admin'), userController.deleteUser);

module.exports = router;