const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  rewardType: {
    type: String,
    enum: ['discount_percentage', 'discount_fixed', 'free_item', 'cashback'],
    required: true
  },
  rewardValue: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'redeemed', 'expired', 'cancelled'],
    default: 'active'
  },
  redeemedAt: Date,
  redeemedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  minPurchaseAmount: {
    type: Number,
    default: 0
  },
  maxDiscountAmount: {
    type: Number,
    default: null
  },
  termsAndConditions: String
}, {
  timestamps: true
});

// Index for queries
couponSchema.index({ code: 1 });
couponSchema.index({ user: 1, status: 1 });
couponSchema.index({ business: 1 });
couponSchema.index({ validUntil: 1 });

// Auto-expire coupons
couponSchema.pre('find', function() {
  this.where({ validUntil: { $gte: new Date() } });
});

module.exports = mongoose.model('Coupon', couponSchema);

