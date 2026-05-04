const Collector = require('../models/Collector');
const User = require('../models/User');
const Request = require('../models/Request');

// @desc    Get collector profile
// @route   GET /api/collectors/profile
// @access  Private (collector)
const getCollectorProfile = async (req, res, next) => {
  try {
    const collector = await Collector.findOne({ userId: req.user._id }).populate('userId', 'name email phone address');
    if (!collector) {
      return res.status(404).json({ success: false, message: 'Collector profile not found' });
    }
    res.status(200).json({ success: true, collector });
  } catch (error) {
    next(error);
  }
};

// @desc    Update collector profile
// @route   PUT /api/collectors/profile
// @access  Private (collector)
const updateCollectorProfile = async (req, res, next) => {
  try {
    const { vehicleType, vehicleNumber, serviceArea, acceptedScrapTypes, coordinates } = req.body;
    const updateData = {};
    if (vehicleType) updateData.vehicleType = vehicleType;
    if (vehicleNumber) updateData.vehicleNumber = vehicleNumber;
    if (serviceArea) updateData.serviceArea = serviceArea;
    if (acceptedScrapTypes) updateData.acceptedScrapTypes = acceptedScrapTypes;
    if (coordinates) updateData.currentLocation = { type: 'Point', coordinates };

    const collector = await Collector.findOneAndUpdate({ userId: req.user._id }, updateData, {
      new: true,
      runValidators: true,
    }).populate('userId', 'name email phone');

    res.status(200).json({ success: true, message: 'Profile updated', collector });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle availability
// @route   PUT /api/collectors/availability
// @access  Private (collector)
const toggleAvailability = async (req, res, next) => {
  try {
    const collector = await Collector.findOne({ userId: req.user._id });
    if (!collector) return res.status(404).json({ success: false, message: 'Collector not found' });

    if (collector.activeRequestId) {
      return res.status(400).json({ success: false, message: 'Cannot go offline while handling an active request' });
    }

    collector.isAvailable = !collector.isAvailable;
    await collector.save();

    res.status(200).json({ success: true, message: `You are now ${collector.isAvailable ? 'available' : 'unavailable'}`, isAvailable: collector.isAvailable });
  } catch (error) {
    next(error);
  }
};

// @desc    Update collector current location
// @route   PUT /api/collectors/location
// @access  Private (collector)
const updateLocation = async (req, res, next) => {
  try {
    const { coordinates } = req.body;
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({ success: false, message: 'Valid coordinates required [lon, lat]' });
    }

    await Collector.findOneAndUpdate(
      { userId: req.user._id },
      { currentLocation: { type: 'Point', coordinates } }
    );

    res.status(200).json({ success: true, message: 'Location updated' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get collector stats
// @route   GET /api/collectors/stats
// @access  Private (collector)
const getCollectorStats = async (req, res, next) => {
  try {
    const collector = await Collector.findOne({ userId: req.user._id });
    const totalRequests = await Request.countDocuments({ collectorId: req.user._id });
    const completedRequests = await Request.countDocuments({ collectorId: req.user._id, status: 'completed' });
    const pendingRequests = await Request.countDocuments({ collectorId: req.user._id, status: { $in: ['assigned', 'out_for_pickup', 'picked_up', 'in_transit'] } });

    res.status(200).json({
      success: true,
      stats: {
        totalRequests,
        completedRequests,
        pendingRequests,
        rating: collector?.rating || 0,
        totalEarnings: collector?.totalEarnings || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all collectors (admin)
// @route   GET /api/collectors
// @access  Private (admin)
const getAllCollectors = async (req, res, next) => {
  try {
    const collectors = await Collector.find().populate('userId', 'name email phone').sort({ createdAt: -1 });
    res.status(200).json({ success: true, collectors });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify collector (admin)
// @route   PUT /api/collectors/:id/verify
// @access  Private (admin)
const verifyCollector = async (req, res, next) => {
  try {
    const collector = await Collector.findByIdAndUpdate(
      req.params.id,
      { isVerified: req.body.isVerified !== undefined ? req.body.isVerified : true },
      { new: true }
    ).populate('userId', 'name email');

    if (!collector) return res.status(404).json({ success: false, message: 'Collector not found' });

    res.status(200).json({ success: true, message: `Collector ${collector.isVerified ? 'verified' : 'unverified'}`, collector });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCollectorProfile, updateCollectorProfile, toggleAvailability, updateLocation, getCollectorStats, getAllCollectors, verifyCollector };
