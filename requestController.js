const Request = require('./Request');
const Collector = require('./Collector');
const Transaction = require('./Transaction');
const Notification = require('./Notification');
const User = require('./User');
const { assignCollector } = require('./assignmentEngine');
const { routeToRecycler } = require('./routingEngine');
const { calculateEstimatedPrice, calculateFinalPrice } = require('./priceCalculator');

const emitToUser = (userId, event, data) => {
  if (global.io && userId) {
    global.io.to(userId.toString()).emit(event, data);
  }
};

// @desc    Create pickup request
// @route   POST /api/requests
// @access  Private (user)
const createRequest = async (req, res, next) => {
  try {
    const { scrapType, estimatedWeight, address, coordinates, scheduledDate, scheduledTime } = req.body;

    const images = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];

    const locationCoords = coordinates
      ? (typeof coordinates === 'string' ? JSON.parse(coordinates) : coordinates)
      : [0, 0];

    const estimatedPrice = calculateEstimatedPrice(scrapType, parseFloat(estimatedWeight));

    const request = await Request.create({
      userId: req.user._id,
      scrapType,
      estimatedWeight: parseFloat(estimatedWeight),
      images,
      address,
      location: { type: 'Point', coordinates: locationCoords },
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      estimatedPrice,
      statusHistory: [{ status: 'pending', note: 'Request created', updatedBy: req.user._id }],
    });

    // Notify all collectors in real-time
    if (global.io) {
      global.io.to('collectors').emit('new_request', {
        requestId: request._id,
        scrapType,
        estimatedWeight: parseFloat(estimatedWeight),
        address,
        scheduledDate,
        scheduledTime,
        customerName: req.user.name,
        message: `New ${scrapType} pickup request from ${req.user.name}`,
      });
    }

    // Try smart assignment
    const assignedCollectorId = await assignCollector(request);
    if (assignedCollectorId) {
      request.collectorId = assignedCollectorId;
      request.status = 'assigned';
      request.assignedAt = new Date();
      request.statusHistory.push({ status: 'assigned', note: 'Collector automatically assigned', updatedBy: req.user._id });
      await request.save();

      // Notify collector of assignment
      emitToUser(assignedCollectorId, 'request_assigned', {
        requestId: request._id,
        scrapType,
        estimatedWeight: parseFloat(estimatedWeight),
        address,
        customerName: req.user.name,
        scheduledDate,
        scheduledTime,
      });
    }

    await Notification.create({
      userId: req.user._id,
      title: 'Pickup Request Created',
      message: assignedCollectorId
        ? `Your ${scrapType} pickup request has been created and a collector has been assigned.`
        : `Your ${scrapType} pickup request has been created. We are finding a collector for you.`,
      type: 'request',
      relatedRequestId: request._id,
    });

    const populated = await Request.findById(request._id)
      .populate('userId', 'name email phone')
      .populate('collectorId', 'name email phone');

    res.status(201).json({ success: true, message: 'Pickup request created', request: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all requests for logged in user
// @route   GET /api/requests/my
// @access  Private (user)
const getMyRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { userId: req.user._id };
    if (status) query.status = status;

    const requests = await Request.find(query)
      .populate('collectorId', 'name email phone')
      .populate('recyclerId', 'name address recyclerType')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Request.countDocuments(query);

    res.status(200).json({ success: true, requests, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single request
// @route   GET /api/requests/:id
// @access  Private
const getRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('userId', 'name email phone address')
      .populate('collectorId', 'name email phone')
      .populate('recyclerId', 'name address recyclerType phone');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const isOwner = request.userId._id.toString() === req.user._id.toString();
    const isCollector = request.collectorId && request.collectorId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isRecycler = req.user.role === 'recycler';

    if (!isOwner && !isCollector && !isAdmin && !isRecycler) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, request });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a request
// @route   PUT /api/requests/:id/cancel
// @access  Private (user, admin)
const cancelRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (request.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (['picked_up', 'in_transit', 'delivered', 'completed'].includes(request.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel a request that is already picked up' });
    }

    if (request.collectorId) {
      await Collector.findOneAndUpdate(
        { userId: request.collectorId },
        { isAvailable: true, activeRequestId: null }
      );
      emitToUser(request.collectorId, 'request_cancelled', { requestId: request._id });
    }

    request.status = 'cancelled';
    request.statusHistory.push({ status: 'cancelled', note: req.body.reason || 'Cancelled by user', updatedBy: req.user._id });
    await request.save();

    res.status(200).json({ success: true, message: 'Request cancelled', request });
  } catch (error) {
    next(error);
  }
};

// @desc    Get requests assigned to collector
// @route   GET /api/requests/collector/assigned
// @access  Private (collector)
const getCollectorRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { collectorId: req.user._id };
    if (status) query.status = status;

    const requests = await Request.find(query)
      .populate('userId', 'name email phone address')
      .populate('recyclerId', 'name address recyclerType')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

// @desc    Collector accepts a request
// @route   PUT /api/requests/:id/accept
// @access  Private (collector)
const acceptRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('collectorId', 'name email phone');

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (!request.collectorId || request.collectorId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (request.status !== 'assigned') {
      return res.status(400).json({ success: false, message: 'Request is not in assignable state' });
    }

    request.status = 'out_for_pickup';
    request.statusHistory.push({ status: 'out_for_pickup', note: 'Collector accepted and is en route', updatedBy: req.user._id });
    await request.save();

    // Notify customer in real-time
    emitToUser(request.userId._id, 'request_accepted', {
      requestId: request._id,
      collectorName: req.user.name,
      collectorPhone: req.user.phone,
      message: `Collector ${req.user.name} has accepted your pickup request and is on the way.`,
      status: 'out_for_pickup',
    });

    await Notification.create({
      userId: request.userId._id,
      title: 'Collector On the Way',
      message: `Collector ${req.user.name} has accepted your request and is heading to your location.`,
      type: 'pickup',
      relatedRequestId: request._id,
    });

    const populated = await Request.findById(request._id)
      .populate('userId', 'name email phone address')
      .populate('collectorId', 'name email phone');

    res.status(200).json({ success: true, message: 'Request accepted', request: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Collector rejects a request
// @route   PUT /api/requests/:id/reject
// @access  Private (collector)
const rejectRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (!request.collectorId || request.collectorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Collector.findOneAndUpdate(
      { userId: req.user._id },
      { isAvailable: true, activeRequestId: null }
    );

    request.collectorId = null;
    request.status = 'pending';
    request.rejectionReason = req.body.reason || 'Rejected by collector';
    request.statusHistory.push({ status: 'pending', note: `Rejected: ${req.body.reason || 'No reason'}`, updatedBy: req.user._id });
    await request.save();

    // Try to reassign
    const newCollectorId = await assignCollector(request);
    if (newCollectorId) {
      request.collectorId = newCollectorId;
      request.status = 'assigned';
      request.assignedAt = new Date();
      request.statusHistory.push({ status: 'assigned', note: 'Reassigned to new collector', updatedBy: req.user._id });
      await request.save();

      emitToUser(newCollectorId, 'request_assigned', {
        requestId: request._id,
        scrapType: request.scrapType,
        estimatedWeight: request.estimatedWeight,
        address: request.address,
      });
    }

    res.status(200).json({ success: true, message: 'Request rejected and reassignment attempted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Collector confirms pickup (marks as picked_up)
// @route   PUT /api/requests/:id/pickup
// @access  Private (collector)
const confirmPickup = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (!request.collectorId || request.collectorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (request.status !== 'out_for_pickup') {
      return res.status(400).json({ success: false, message: 'Request must be in out_for_pickup state to confirm' });
    }

    const { actualWeight, collectorNotes } = req.body;
    const proofImages = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];

    const weight = parseFloat(actualWeight) || request.estimatedWeight;
    const priceData = calculateFinalPrice(request.scrapType, weight);

    request.actualWeight = weight;
    request.finalPrice = priceData.totalAmount;
    request.collectorNotes = collectorNotes || '';
    if (proofImages.length) request.proofImages = proofImages;
    request.status = 'picked_up';
    request.pickedUpAt = new Date();
    request.statusHistory.push({ status: 'picked_up', note: `Picked up. Weight: ${weight}kg`, updatedBy: req.user._id });
    await request.save();

    // Notify customer
    emitToUser(request.userId, 'status_update', {
      requestId: request._id,
      status: 'picked_up',
      message: `Your scrap has been picked up. Weight confirmed: ${weight}kg`,
      actualWeight: weight,
      finalPrice: priceData.totalAmount,
    });

    // Route to recycler
    const recyclerId = await routeToRecycler(request);
    if (recyclerId) {
      request.recyclerId = recyclerId;
      request.status = 'in_transit';
      request.statusHistory.push({ status: 'in_transit', note: 'Routed to recycler, in transit', updatedBy: req.user._id });
      await request.save();

      emitToUser(request.userId, 'status_update', {
        requestId: request._id,
        status: 'in_transit',
        message: 'Your scrap is in transit to the recycling facility.',
      });

      // Notify recyclers room
      if (global.io) {
        global.io.to('recyclers').emit('new_delivery', {
          requestId: request._id,
          scrapType: request.scrapType,
          weight,
          collectorName: req.user.name,
          status: 'in_transit',
        });
      }
    }

    await Transaction.create({
      requestId: request._id,
      userId: request.userId,
      collectorId: request.collectorId,
      recyclerId: request.recyclerId,
      scrapType: request.scrapType,
      weight,
      pricePerKg: priceData.pricePerKg,
      totalAmount: priceData.totalAmount,
      collectorShare: priceData.collectorShare,
      platformFee: priceData.platformFee,
      paymentStatus: 'pending',
    });

    await Notification.create({
      userId: request.userId,
      title: 'Scrap Picked Up',
      message: `Your ${request.scrapType} scrap (${weight}kg) has been picked up. Estimated value: Rs ${priceData.totalAmount}`,
      type: 'pickup',
      relatedRequestId: request._id,
    });

    res.status(200).json({ success: true, message: 'Pickup confirmed and routed to recycler', request });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark as delivered to recycler
// @route   PUT /api/requests/:id/deliver
// @access  Private (collector, recycler, admin)
const markDelivered = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (!['picked_up', 'in_transit'].includes(request.status)) {
      return res.status(400).json({ success: false, message: 'Request must be picked up or in transit to mark delivered' });
    }

    request.status = 'delivered';
    request.deliveredAt = new Date();
    request.statusHistory.push({ status: 'delivered', note: 'Delivered to recycler facility', updatedBy: req.user._id });
    await request.save();

    await Collector.findOneAndUpdate(
      { userId: request.collectorId },
      { isAvailable: true, activeRequestId: null, $inc: { completedPickups: 1 } }
    );

    emitToUser(request.userId, 'status_update', {
      requestId: request._id,
      status: 'delivered',
      message: 'Your scrap has been delivered to the recycling facility.',
    });

    if (global.io && request.recyclerId) {
      global.io.to('recyclers').emit('delivery_arrived', {
        requestId: request._id,
        scrapType: request.scrapType,
        weight: request.actualWeight || request.estimatedWeight,
        status: 'delivered',
      });
    }

    await Notification.create({
      userId: request.userId,
      title: 'Scrap Delivered',
      message: 'Your scrap has been delivered to the recycling facility successfully.',
      type: 'delivery',
      relatedRequestId: request._id,
    });

    res.status(200).json({ success: true, message: 'Marked as delivered', request });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark as completed (recycler processes)
// @route   PUT /api/requests/:id/complete
// @access  Private (recycler, admin)
const completeRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (request.status !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Request must be delivered before completing' });
    }

    request.status = 'completed';
    request.completedAt = new Date();
    request.statusHistory.push({ status: 'completed', note: 'Processing completed by recycler', updatedBy: req.user._id });
    await request.save();

    await Transaction.findOneAndUpdate(
      { requestId: request._id },
      { paymentStatus: 'completed', paidAt: new Date() }
    );

    emitToUser(request.userId, 'status_update', {
      requestId: request._id,
      status: 'completed',
      message: `Your scrap pickup is fully processed. Payment of Rs ${request.finalPrice} has been credited.`,
      finalPrice: request.finalPrice,
    });

    await Notification.create({
      userId: request.userId,
      title: 'Request Completed',
      message: `Your scrap pickup request has been fully processed. Payment of Rs ${request.finalPrice} has been credited.`,
      type: 'payment',
      relatedRequestId: request._id,
    });

    res.status(200).json({ success: true, message: 'Request completed', request });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all requests (admin)
// @route   GET /api/requests
// @access  Private (admin)
const getAllRequests = async (req, res, next) => {
  try {
    const { status, scrapType, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (scrapType) query.scrapType = scrapType;

    const requests = await Request.find(query)
      .populate('userId', 'name email phone')
      .populate('collectorId', 'name email phone')
      .populate('recyclerId', 'name address recyclerType')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Request.countDocuments(query);

    res.status(200).json({ success: true, requests, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest, getMyRequests, getRequest, cancelRequest,
  getCollectorRequests, acceptRequest, rejectRequest,
  confirmPickup, markDelivered, completeRequest, getAllRequests,
};
