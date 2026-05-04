const express = require('express');
const Transaction = require('./Transaction');
const { protect } = require('./middleware/protect');

const router = express.Router();

router.use(protect);

// Get user's transactions
router.get('/my', async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .populate('requestId', 'scrapType status')
      .populate('collectorId', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, transactions });
  } catch (error) {
    next(error);
  }
});

// Get single transaction
router.get('/:id', async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('requestId', 'scrapType status address')
      .populate('recyclerId', 'name address');
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.status(200).json({ success: true, transaction });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
