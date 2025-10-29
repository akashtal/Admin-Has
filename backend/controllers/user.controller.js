const User = require('../models/User.model');
const Review = require('../models/Review.model');
const Coupon = require('../models/Coupon.model');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    // req.user is already populated by auth middleware from correct collection
    const user = req.user;

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        status: user.status,
        createdAt: user.createdAt,
        ...(user.role === 'business' && { businesses: user.businesses }),
        ...(user.role === 'customer' && { location: user.location })
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, location } = req.body;

    // req.user is already populated by auth middleware
    const user = req.user;

    if (name) user.name = name;
    if (phone) user.phone = phone;
    
    // Only update location for customers (User collection has location field)
    if (location && user.role === 'customer') {
      user.location = {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
        address: location.address
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profileImage: user.profileImage,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        status: user.status,
        createdAt: user.createdAt,
        ...(user.role === 'business' && { businesses: user.businesses }),
        ...(user.role === 'customer' && { location: user.location })
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user reviews
// @route   GET /api/users/reviews
// @access  Private
exports.getUserReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ user: req.user.id })
      .populate('business', 'name logo category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ user: req.user.id });

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user coupons
// @route   GET /api/users/coupons
// @access  Private
exports.getUserCoupons = async (req, res, next) => {
  try {
    const { status } = req.query;
    
    const query = { user: req.user.id };
    if (status) query.status = status;

    const coupons = await Coupon.find(query)
      .populate('business', 'name logo')
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

// @desc    Get user reward history
// @route   GET /api/users/rewards
// @access  Private
exports.getRewardHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const coupons = await Coupon.find({ user: req.user.id })
      .populate('business', 'name logo')
      .populate('review', 'rating comment')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Coupon.countDocuments({ user: req.user.id });

    res.status(200).json({
      success: true,
      count: coupons.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      rewards: coupons
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload profile image
// @route   POST /api/users/upload-image
// @access  Private
exports.uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    // req.user is already populated by auth middleware
    const user = req.user;
    user.profileImage = `/uploads/${req.file.filename}`;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      imageUrl: user.profileImage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
exports.deleteAccount = async (req, res, next) => {
  try {
    // req.user is already populated by auth middleware
    const user = req.user;
    user.status = 'inactive';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

