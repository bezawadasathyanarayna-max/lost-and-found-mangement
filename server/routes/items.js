const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/itemsController');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// Public/Optional auth routes
router.get('/', optionalAuth, itemsController.getItems);
router.get('/:id', optionalAuth, itemsController.getItemById);

// Protected routes (Logged-in users)
router.post('/', requireAuth, itemsController.createItem);
router.put('/:id', requireAuth, itemsController.updateItem);
router.delete('/:id', requireAuth, itemsController.deleteItem);

module.exports = router;
