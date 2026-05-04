const Collector = require('./Collector');
const Notification = require('./notifications');
const { haversineDistance } = require('./geoUtils');

/**
 * Find and assign the best available collector for a pickup request.
 * Does NOT require isVerified=true so newly registered collectors can work.
 * Priority score = (rating * 2) / (distance + 1)
 */
const assignCollector = async (request) => {
  try {
    const [reqLon, reqLat] = request.location.coordinates;

    // Find collectors that accept this scrap type and are available
    let collectors = await Collector.find({
      isAvailable: true,
      activeRequestId: null,
      acceptedScrapTypes: request.scrapType,
    }).populate('userId', 'name email phone location');

    // Fallback: any available collector if none match scrap type
    if (!collectors.length) {
      collectors = await Collector.find({
        isAvailable: true,
        activeRequestId: null,
      }).populate('userId', 'name email phone location');
    }

    if (!collectors.length) return null;

    // Score each collector by rating and distance
    const scored = collectors.map((collector) => {
      const [colLon, colLat] = collector.currentLocation.coordinates;
      const distance = haversineDistance([reqLon, reqLat], [colLon, colLat]);
      const score = (collector.rating * 2) / (distance + 1);
      return { collector, distance, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const best = scored[0];
    if (!best) return null;

    const { collector } = best;

    // Mark collector as busy
    await Collector.findByIdAndUpdate(collector._id, {
      isAvailable: false,
      activeRequestId: request._id,
    });

    // Create notification for collector
    await Notification.create({
      userId: collector.userId._id,
      title: 'New Pickup Request',
      message: `You have been assigned a new ${request.scrapType} pickup request at ${request.address}`,
      type: 'assignment',
      relatedRequestId: request._id,
    });

    // Emit real-time event to collector
    if (global.io) {
      global.io.to(collector.userId._id.toString()).emit('request_assigned', {
        requestId: request._id,
        scrapType: request.scrapType,
        estimatedWeight: request.estimatedWeight,
        address: request.address,
        scheduledDate: request.scheduledDate,
        scheduledTime: request.scheduledTime,
      });
    }

    return collector.userId._id;
  } catch (error) {
    console.error('Assignment engine error:', error.message);
    return null;
  }
};

module.exports = { assignCollector };
