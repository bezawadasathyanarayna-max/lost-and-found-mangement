const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const itemsController = require('../controllers/itemsController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(requireAuth, requireAdmin);

router.get('/stats', adminController.getAdminStats);
router.get('/items', adminController.getAdminItems);
router.put('/items/:id/status', adminController.updateItemStatus);
router.delete('/items/:id', itemsController.deleteItem);

module.exports = router;
