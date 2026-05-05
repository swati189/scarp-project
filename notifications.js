const express = require('express');
const { getNotifications, markAsRead, markAllAsRead, deleteNotification } = require('./notificationController');
const { protect, authorize } = require('./middleware/protect');


const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
