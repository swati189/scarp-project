const mongoose = require('mongoose');

const collectorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    vehicleType: {
      type: String,
      enum: ['cycle', 'rickshaw', 'tempo', 'truck'],
      default: 'rickshaw',
    },
    vehicleNumber: {
      type: String,
      trim: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 4.0,
      min: 1,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    completedPickups: {
      type: Number,
      default: 0,
    },
    currentLocation: {
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
    serviceArea: {
      type: String,
      default: '',
    },
    activeRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      default: null,
    },
    acceptedScrapTypes: {
      type: [String],
      enum: ['Paper', 'Plastic', 'Metal', 'Electronics', 'Appliances', 'Glass', 'Mixed'],
      default: ['Paper', 'Plastic', 'Metal', 'Electronics', 'Appliances', 'Glass', 'Mixed'],
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

collectorSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('Collector', collectorSchema);
