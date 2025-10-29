const Coupon = require('../models/Coupon.model');
const Business = require('../models/Business.model');
const { isCouponValid, calculateDiscount } = require('../utils/coupon');

// @desc    Get user coupons
// @route   GET /api/coupons
// @access  Private
exports.getCoupons = async (req, res, next) => {
  try {
    const { status } = req.query;
    
    const query = { user: req.user.id };
    if (status) query.status = status;

    const coupons = await Coupon.find(query)
      .populate('business', 'name logo address')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: coupons.length,
      coupons
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single coupon
// @route   GET /api/coupons/:id
// @access  Private
exports.getCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('business', 'name logo address phone')
      .populate('user', 'name email phone');

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    // Check authorization
    if (coupon.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this coupon'
      });
    }

    res.status(200).json({
      success: true,
      coupon
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify coupon by code
// @route   POST /api/coupons/verify
// @access  Private (Business owner)
exports.verifyCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;

    const coupon = await Coupon.findOne({ code })
      .populate('business', 'name')
      .populate('user', 'name email phone');

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    // Get business to check ownership
    const business = await Business.findById(coupon.business._id);
    
    if (business.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to verify this coupon'
      });
    }

    // Check if coupon is valid
    if (!isCouponValid(coupon)) {
      return res.status(400).json({
        success: false,
        message: 'Coupon is expired or invalid',
        coupon
      });
    }

    res.status(200).json({
      success: true,
      message: 'Coupon is valid',
      coupon
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Redeem coupon
// @route   POST /api/coupons/:id/redeem
// @access  Private (Business owner)
exports.redeemCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('business');

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    // Check business ownership
    const business = await Business.findById(coupon.business._id);
    
    if (business.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to redeem this coupon'
      });
    }

    // Validate coupon
    if (!isCouponValid(coupon)) {
      return res.status(400).json({
        success: false,
        message: 'Coupon is expired or already redeemed'
      });
    }

    // Redeem coupon
    coupon.status = 'redeemed';
    coupon.redeemedAt = new Date();
    coupon.redeemedBy = req.user.id;
    await coupon.save();

    res.status(200).json({
      success: true,
      message: 'Coupon redeemed successfully',
      coupon
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get business coupons
// @route   GET /api/coupons/business/:businessId
// @access  Private (Business owner)
exports.getBusinessCoupons = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.businessId);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    if (business.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const coupons = await Coupon.find({ business: req.params.businessId })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: coupons.length,
      coupons
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Calculate discount amount
// @route   POST /api/coupons/calculate-discount
// @access  Private
exports.calculateCouponDiscount = async (req, res, next) => {
  try {
    const { couponId, purchaseAmount } = req.body;

    const coupon = await Coupon.findById(couponId);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    if (coupon.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'This coupon does not belong to you'
      });
    }

    if (!isCouponValid(coupon)) {
      return res.status(400).json({
        success: false,
        message: 'Coupon is expired or invalid'
      });
    }

    if (purchaseAmount < coupon.minPurchaseAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase amount is ${coupon.minPurchaseAmount}`
      });
    }

    const discount = calculateDiscount(coupon, purchaseAmount);
    const finalAmount = purchaseAmount - discount;

    res.status(200).json({
      success: true,
      discount,
      finalAmount,
      coupon
    });
  } catch (error) {
    next(error);
  }
};

