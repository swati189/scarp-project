const express = require('express');
const { getDashboardStats, getAllUsers, toggleUserStatus, changeUserRole, getTransactions } = require('./adminController');
const { protect, authorize } = require('../middleware/protect');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle', toggleUserStatus);
router.put('/users/:id/role', changeUserRole);
router.get('/transactions', getTransactions);

module.exports = router;
