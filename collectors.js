const express = require('express');
const {
  getCollectorProfile, updateCollectorProfile, toggleAvailability,
  updateLocation, getCollectorStats, getAllCollectors, verifyCollector,
} = require('./collectorController');
const { protect, authorize } = require('../middleware/protect');

const router = express.Router();

// Admin
router.get('/', protect, authorize('admin'), getAllCollectors);
router.put('/:id/verify', protect, authorize('admin'), verifyCollector);

// Collector
router.get('/profile', protect, authorize('collector'), getCollectorProfile);
router.put('/profile', protect, authorize('collector'), updateCollectorProfile);
router.put('/availability', protect, authorize('collector'), toggleAvailability);
router.put('/location', protect, authorize('collector'), updateLocation);
router.get('/stats', protect, authorize('collector'), getCollectorStats);

module.exports = router;
