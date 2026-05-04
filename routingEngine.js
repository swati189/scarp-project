const Recycler = require('./Recycler');
const Notification = require('./Notification');
const { haversineDistance } = require('./geoUtils');

const SCRAP_TO_RECYCLER = {
  Paper: 'Paper Recycling Unit',
  Plastic: 'Plastic Processing Plant',
  Metal: 'Metal Scrap Yard',
  Electronics: 'E-waste Facility',
  Appliances: 'Dismantling Unit',
  Glass: 'Glass Recycler',
  Mixed: 'General',
};

/**
 * Route a completed pickup to the nearest compatible recycler.
 * Priority: scrap type compatibility -> nearest -> has capacity.
 * Does NOT require isVerified so newly registered recyclers can receive deliveries.
 */
const routeToRecycler = async (request) => {
  try {
    const [reqLon, reqLat] = request.location.coordinates;
    const targetType = SCRAP_TO_RECYCLER[request.scrapType] || 'General';

    // Find compatible active recyclers with capacity — no isVerified requirement
    let recyclers = await Recycler.find({
      supportedScrapTypes: request.scrapType,
      isActive: true,
      $expr: { $lt: ['$currentCapacity', '$maxCapacity'] },
    });

    // Fallback: any active recycler with capacity
    if (!recyclers.length) {
      recyclers = await Recycler.find({
        isActive: true,
        $expr: { $lt: ['$currentCapacity', '$maxCapacity'] },
      });
    }

    // Final fallback: any active recycler regardless of capacity
    if (!recyclers.length) {
      recyclers = await Recycler.find({ isActive: true });
    }

    if (!recyclers.length) return null;

    // Score by nearest and preferred type
    const scored = recyclers.map((recycler) => {
      const [rLon, rLat] = recycler.location.coordinates;
      const distance = haversineDistance([reqLon, reqLat], [rLon, rLat]);
      const capacityRatio = recycler.maxCapacity > 0
        ? (recycler.maxCapacity - recycler.currentCapacity) / recycler.maxCapacity
        : 0.5;
      const isPreferred = recycler.recyclerType === targetType ? 1.5 : 1;
      const score = (capacityRatio * isPreferred) / (distance + 1);
      return { recycler, distance, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const best = scored[0].recycler;

    // Update recycler capacity
    await Recycler.findByIdAndUpdate(best._id, {
      $inc: { currentCapacity: request.actualWeight || request.estimatedWeight },
    });

    // Notify recycler user if linked
    if (best.userId) {
      await Notification.create({
        userId: best.userId,
        title: 'Incoming Scrap Batch',
        message: `A ${request.scrapType} batch of ${request.actualWeight || request.estimatedWeight} kg is being routed to your facility.`,
        type: 'delivery',
        relatedRequestId: request._id,
      });

      // Real-time notify recycler
      if (global.io) {
        global.io.to(best.userId.toString()).emit('new_delivery', {
          requestId: request._id,
          scrapType: request.scrapType,
          weight: request.actualWeight || request.estimatedWeight,
          status: 'in_transit',
        });
      }
    }

    return best._id;
  } catch (error) {
    console.error('Routing engine error:', error.message);
    return null;
  }
};

module.exports = { routeToRecycler, SCRAP_TO_RECYCLER };
