const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    recyclerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recycler',
      default: null,
    },
    scrapType: {
      type: String,
      enum: ['Paper', 'Plastic', 'Metal', 'Electronics', 'Appliances', 'Glass', 'Mixed'],
      required: [true, 'Scrap type is required'],
    },
    estimatedWeight: {
      type: Number,
      required: [true, 'Estimated weight is required'],
      min: [0.5, 'Minimum weight is 0.5 kg'],
    },
    actualWeight: {
      type: Number,
      default: null,
    },
    images: [
      {
        type: String,
      },
    ],
    proofImages: [
      {
        type: String,
      },
    ],
    address: {
      type: String,
      required: [true, 'Pickup address is required'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Pickup date is required'],
    },
    scheduledTime: {
      type: String,
      required: [true, 'Pickup time is required'],
    },
    status: {
      type: String,
      enum: [
        'pending',
        'assigned',
        'out_for_pickup',
        'picked_up',
        'in_transit',
        'delivered',
        'completed',
        'rejected',
        'cancelled',
      ],
      default: 'pending',
    },
    statusHistory: [
      {
        status: { type: String },
        timestamp: { type: Date, default: Date.now },
        note: { type: String },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    estimatedPrice: {
      type: Number,
      default: 0,
    },
    finalPrice: {
      type: Number,
      default: null,
    },
    collectorNotes: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    aiSuggestion: {
      suggestedType: { type: String },
      confidence: { type: Number },
    },
    assignedAt: { type: Date },
    pickedUpAt: { type: Date },
    deliveredAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

requestSchema.index({ location: '2dsphere' });
requestSchema.index({ status: 1 });
requestSchema.index({ userId: 1 });
requestSchema.index({ collectorId: 1 });

module.exports = mongoose.model('Request', requestSchema);
