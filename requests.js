const express = require('express');
const {
  createRequest, getMyRequests, getRequest, cancelRequest,
  getCollectorRequests, acceptRequest, rejectRequest,
  confirmPickup, markDelivered, completeRequest, getAllRequests,
} = require('./requestController');
const { protect, authorize } = require('./auth');
const upload = require('./upload');

const router = express.Router();

// Admin
router.get('/', protect, authorize('admin'), getAllRequests);

// User routes
router.post('/', protect, authorize('user'), upload.array('images', 5), createRequest);
router.get('/my', protect, getMyRequests);
router.put('/:id/cancel', protect, cancelRequest);

// Collector routes
router.get('/collector/assigned', protect, authorize('collector'), getCollectorRequests);
router.put('/:id/accept', protect, authorize('collector'), acceptRequest);
router.put('/:id/reject', protect, authorize('collector'), rejectRequest);
router.put('/:id/pickup', protect, authorize('collector'), upload.array('proofImages', 3), confirmPickup);
router.put('/:id/deliver', protect, authorize('collector', 'admin'), markDelivered);

// Recycler / Admin
router.put('/:id/complete', protect, authorize('recycler', 'admin'), completeRequest);

// Single request (owner or collector or admin)
router.get('/:id', protect, getRequest);

module.exports = router;
