const User = require('../models/User.model');
const Business = require('../models/Business.model');
const BusinessOwner = require('../models/BusinessOwner.model');
const Review = require('../models/Review.model');
const Coupon = require('../models/Coupon.model');
const { sendPushNotification, sendBulkNotifications } = require('../utils/notification');
const { sendEmail } = require('../utils/emailService');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Get counts
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalBusinesses = await Business.countDocuments();
    const activeBusinesses = await Business.countDocuments({ status: 'active' });
    const pendingBusinesses = await Business.countDocuments({ status: 'pending' });
    const totalReviews = await Review.countDocuments();
    const totalCoupons = await Coupon.countDocuments();

    // Get recent users
    const recentUsers = await User.find()
      .select('name email role status createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent businesses
    const recentBusinesses = await Business.find()
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get reviews stats
    const reviewStats = await Review.aggregate([
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // Get monthly growth
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: lastMonth }
    });

    const newBusinessesThisMonth = await Business.countDocuments({
      createdAt: { $gte: lastMonth }
    });

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth
        },
        businesses: {
          total: totalBusinesses,
          active: activeBusinesses,
          pending: pendingBusinesses,
          newThisMonth: newBusinessesThisMonth
        },
        reviews: {
          total: totalReviews,
          distribution: reviewStats
        },
        coupons: {
          total: totalCoupons
        }
      },
      recentUsers,
      recentBusinesses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { role, status, search } = req.query;

    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all businesses
// @route   GET /api/admin/businesses
// @access  Private (Admin)
exports.getAllBusinesses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status, kycStatus, category, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (kycStatus) query.kycStatus = kycStatus;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const businesses = await Business.find(query)
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Business.countDocuments(query);

    res.status(200).json({
      success: true,
      count: businesses.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      businesses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/Reject business KYC
// @route   PUT /api/admin/businesses/:id/kyc
// @access  Private (Admin)
exports.updateBusinessKYC = async (req, res, next) => {
  try {
    const { action, reason } = req.body; // action: 'approve' or 'reject'

    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    // Get business owner
    const owner = await BusinessOwner.findById(business.owner);

    if (action === 'approve') {
      business.kycStatus = 'approved';
      business.status = 'active';
      business.verifiedAt = new Date();
      business.verifiedBy = req.user.id;

      // Send push notification to business owner
      await sendPushNotification(
        business.owner,
        'Business Approved! 🎉',
        `Your business "${business.name}" has been approved and is now active.`,
        { type: 'business_verification', businessId: business._id.toString() }
      );

      // Send email notification
      if (owner) {
        await sendEmail({
          to: owner.email,
          subject: 'Business Approved - You Are Now Live! 🎉',
          html: `
            <h2>Congratulations ${owner.name}!</h2>
            <p>Great news! Your business <strong>${business.name}</strong> has been approved by our admin team!</p>
            
            <p><strong>✅ What This Means:</strong></p>
            <ul>
              <li>Your business is now <strong>LIVE</strong> and visible to all HashView users</li>
              <li>Customers can now find you, read reviews, and redeem coupons</li>
              <li>You can start managing your business dashboard</li>
            </ul>
            
            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>Log in to your business dashboard</li>
              <li>Update your business hours and details</li>
              <li>Create special offers and coupons for customers</li>
              <li>Start building your reputation with verified reviews</li>
            </ol>
            
            <p>Thank you for choosing HashView!</p>
            <p>Best regards,<br>HashView Team</p>
          `
        });
      }
    } else if (action === 'reject') {
      business.kycStatus = 'rejected';
      business.status = 'rejected';
      business.rejectionReason = reason || 'KYC verification failed';

      // Send push notification to business owner
      await sendPushNotification(
        business.owner,
        'Business Verification Failed',
        `Your business "${business.name}" verification was rejected. Reason: ${business.rejectionReason}`,
        { type: 'business_verification', businessId: business._id.toString() }
      );

      // Send email notification
      if (owner) {
        await sendEmail({
          to: owner.email,
          subject: 'Business Verification Status - Action Required',
          html: `
            <h2>Hi ${owner.name},</h2>
            <p>We regret to inform you that your business <strong>${business.name}</strong> could not be approved at this time.</p>
            
            <p><strong>Reason:</strong></p>
            <p style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 12px; color: #991B1B;">
              ${business.rejectionReason}
            </p>
            
            <p><strong>What You Can Do:</strong></p>
            <ol>
              <li>Review the rejection reason above</li>
              <li>Update your business information or documents</li>
              <li>Resubmit your verification request</li>
              <li>Contact our support team if you need assistance: support@hashview.com</li>
            </ol>
            
            <p>We're here to help you get verified!</p>
            <p>Best regards,<br>HashView Team</p>
          `
        });
      }
    }

    await business.save();

    res.status(200).json({
      success: true,
      message: `Business ${action}ed successfully`,
      business
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.status = status;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews
// @route   GET /api/admin/reviews
// @access  Private (Admin)
exports.getAllReviews = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status } = req.query;

    const query = {};
    if (status) query.status = status;

    const reviews = await Review.find(query)
      .populate('user', 'name email')
      .populate('business', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments(query);

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

// @desc    Update review status
// @route   PUT /api/admin/reviews/:id/status
// @access  Private (Admin)
exports.updateReviewStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.status = status;
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review status updated successfully',
      review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send push notification
// @route   POST /api/admin/notifications/send
// @access  Private (Admin)
exports.sendNotification = async (req, res, next) => {
  try {
    const { title, message, userIds, sendToAll } = req.body;

    if (sendToAll) {
      // Send to all users
      const users = await User.find({ pushToken: { $exists: true, $ne: null } })
        .select('_id');
      
      const allUserIds = users.map(u => u._id);
      
      const results = await sendBulkNotifications(allUserIds, title, message);

      res.status(200).json({
        success: true,
        message: `Notifications sent to ${allUserIds.length} users`,
        results
      });
    } else if (userIds && userIds.length > 0) {
      // Send to specific users
      const results = await sendBulkNotifications(userIds, title, message);

      res.status(200).json({
        success: true,
        message: `Notifications sent to ${userIds.length} users`,
        results
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide userIds or set sendToAll to true'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete business
// @route   DELETE /api/admin/businesses/:id
// @access  Private (Admin)
exports.deleteBusiness = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    await business.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Business deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

