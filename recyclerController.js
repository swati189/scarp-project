const Recycler = require('./Recycler');
const Request = require('./Request');

// @desc    Get all recyclers
// @route   GET /api/recyclers
// @access  Private (admin, collector)
const getAllRecyclers = async (req, res, next) => {
  try {
    const { scrapType, active } = req.query;
    const query = {};
    if (scrapType) query.supportedScrapTypes = scrapType;
    if (active !== undefined) query.isActive = active === 'true';

    const recyclers = await Recycler.find(query).sort({ name: 1 });
    res.status(200).json({ success: true, recyclers });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single recycler
// @route   GET /api/recyclers/:id
// @access  Private
const getRecycler = async (req, res, next) => {
  try {
    const recycler = await Recycler.findById(req.params.id);
    if (!recycler) return res.status(404).json({ success: false, message: 'Recycler not found' });
    res.status(200).json({ success: true, recycler });
  } catch (error) {
    next(error);
  }
};

// @desc    Create recycler (admin)
// @route   POST /api/recyclers
// @access  Private (admin)
const createRecycler = async (req, res, next) => {
  try {
    const recycler = await Recycler.create(req.body);
    res.status(201).json({ success: true, message: 'Recycler created', recycler });
  } catch (error) {
    next(error);
  }
};

// @desc    Update recycler (admin)
// @route   PUT /api/recyclers/:id
// @access  Private (admin)
const updateRecycler = async (req, res, next) => {
  try {
    const recycler = await Recycler.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!recycler) return res.status(404).json({ success: false, message: 'Recycler not found' });
    res.status(200).json({ success: true, message: 'Recycler updated', recycler });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete recycler (admin)
// @route   DELETE /api/recyclers/:id
// @access  Private (admin)
const deleteRecycler = async (req, res, next) => {
  try {
    const recycler = await Recycler.findByIdAndDelete(req.params.id);
    if (!recycler) return res.status(404).json({ success: false, message: 'Recycler not found' });
    res.status(200).json({ success: true, message: 'Recycler deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get requests assigned to this recycler
// @route   GET /api/recyclers/requests
// @access  Private (recycler)
const getRecyclerRequests = async (req, res, next) => {
  try {
    const recycler = await Recycler.findOne({ userId: req.user._id });
    if (!recycler) {
      return res.status(200).json({ success: true, requests: [] });
    }

    const requests = await Request.find({ recyclerId: recycler._id })
      .populate('userId', 'name email phone')
      .populate('collectorId', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark delivery as received by recycler
// @route   PUT /api/recyclers/requests/:id/receive
// @access  Private (recycler)
const markReceived = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (!['in_transit', 'picked_up'].includes(request.status)) {
      return res.status(400).json({ success: false, message: 'Request must be in transit to mark as received' });
    }

    request.status = 'delivered';
    request.deliveredAt = new Date();
    request.statusHistory.push({ status: 'delivered', note: 'Received by recycler facility', updatedBy: req.user._id });
    await request.save();

    // Notify customer
    if (global.io) {
      global.io.to(request.userId.toString()).emit('status_update', {
        requestId: request._id,
        status: 'delivered',
        message: 'Your scrap has been received by the recycling facility.',
      });
    }

    res.status(200).json({ success: true, message: 'Marked as received', request });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify recycler (admin)
// @route   PUT /api/recyclers/:id/verify
// @access  Private (admin)
const verifyRecycler = async (req, res, next) => {
  try {
    const recycler = await Recycler.findByIdAndUpdate(
      req.params.id,
      { isVerified: req.body.isVerified !== undefined ? req.body.isVerified : true },
      { new: true }
    );
    if (!recycler) return res.status(404).json({ success: false, message: 'Recycler not found' });
    res.status(200).json({ success: true, recycler });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRecyclers, getRecycler, createRecycler, updateRecycler,
  deleteRecycler, getRecyclerRequests, markReceived, verifyRecycler,
};
