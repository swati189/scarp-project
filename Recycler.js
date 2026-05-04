const mongoose = require('mongoose');

const recyclerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Recycler name is required'],
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    supportedScrapTypes: {
      type: [String],
      enum: ['Paper', 'Plastic', 'Metal', 'Electronics', 'Appliances', 'Glass', 'Mixed'],
      required: true,
    },
    recyclerType: {
      type: String,
      enum: [
        'Paper Recycling Unit',
        'Plastic Processing Plant',
        'Metal Scrap Yard',
        'E-waste Facility',
        'Dismantling Unit',
        'Glass Recycler',
        'General',
      ],
      required: true,
    },
    currentCapacity: {
      type: Number,
      default: 100,
      min: 0,
    },
    maxCapacity: {
      type: Number,
      default: 1000,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    totalProcessed: {
      type: Number,
      default: 0,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

recyclerSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Recycler', recyclerSchema);
