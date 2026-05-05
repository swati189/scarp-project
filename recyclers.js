const express = require('express');
const {
  getAllRecyclers, getRecycler, createRecycler, updateRecycler,
  deleteRecycler, getRecyclerRequests, markReceived, verifyRecycler,
} = require('./recyclerController');
const { protect, authorize } = require('./middleware/protect');


const router = express.Router();

router.get('/', protect, authorize('admin', 'collector'), getAllRecyclers);
router.get('/requests', protect, authorize('recycler', 'admin'), getRecyclerRequests);
router.put('/requests/:id/receive', protect, authorize('recycler', 'admin'), markReceived);
router.get('/:id', protect, getRecycler);
router.post('/', protect, authorize('admin'), createRecycler);
router.put('/:id', protect, authorize('admin'), updateRecycler);
router.put('/:id/verify', protect, authorize('admin'), verifyRecycler);
router.delete('/:id', protect, authorize('admin'), deleteRecycler);

module.exports = router;
