const Business = require('../models/Business.model');
const Review = require('../models/Review.model');
const { generateBusinessQRCode } = require('../utils/qrcode');
const { getNearbyQuery } = require('../utils/geolocation');

// @desc    Create/Register new business
// @route   POST /api/business/register
// @access  Private (Business role)
exports.registerBusiness = async (req, res, next) => {
  try {
    console.log('\n📝 Business Registration Attempt');
    console.log('User ID:', req.user?.id);
    console.log('Request Body:', JSON.stringify(req.body, null, 2));

    const {
      name, ownerName, email, phone, category, description,
      address, latitude, longitude, radius,
      website, tripAdvisorLink, googleBusinessName, openingHours
    } = req.body;

    // Check if business already exists for this user
    const existingBusiness = await Business.findOne({ owner: req.user.id });
    if (existingBusiness) {
      return res.status(400).json({
        success: false,
        message: 'You already have a registered business'
      });
    }

    // Prepare business data
    const businessData = {
      name,
      ownerName,
      email,
      phone,
      category,
      description,
      owner: req.user.id,
      status: 'pending',
      kycStatus: 'pending',
      radius: radius || 50
    };

    // Handle address - if it's a simple string or structured object
    if (typeof address === 'string') {
      businessData.address = {
        fullAddress: address
      };
    } else {
      businessData.address = {
        ...address,
        fullAddress: address.fullAddress || `${address.street}, ${address.city}, ${address.state}, ${address.country} ${address.zipCode}`
      };
    }

    // Handle location - REQUIRED for geofencing feature
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Business location (latitude and longitude) is required for geofencing functionality. Please enable location services and try again.'
      });
    }
    
    businessData.location = {
      type: 'Point',
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    };

    // Handle opening hours
    if (openingHours) {
      businessData.openingHours = openingHours;
    }

    // Handle social media (only add if at least one field is provided)
    const { facebook, instagram, twitter } = req.body;
    if (website || facebook || instagram || twitter) {
      businessData.socialMedia = {
        website: website || '',
        facebook: facebook || '',
        instagram: instagram || '',
        twitter: twitter || ''
      };
    }

    // Handle external profiles (only add if provided)
    if (req.body.tripAdvisorUrl || tripAdvisorLink || googleBusinessName) {
      businessData.externalProfiles = {
        tripAdvisor: {
          profileUrl: req.body.tripAdvisorUrl || tripAdvisorLink || ''
        },
        googleBusiness: {
          businessName: googleBusinessName || ''
        }
      };
    }

    // Handle logo upload (if using multipart/form-data)
    if (req.files && req.files.logo) {
      businessData.logo = {
        url: `/uploads/${req.files.logo[0].filename}`
      };
    }

    // Handle cover image upload
    if (req.files && req.files.coverImage) {
      businessData.coverImage = {
        url: `/uploads/${req.files.coverImage[0].filename}`
      };
    }

    // Create business
    console.log('Creating business with data:', JSON.stringify(businessData, null, 2));
    const business = await Business.create(businessData);
    console.log('✅ Business created successfully:', business._id);

    res.status(201).json({
      success: true,
      message: 'Business registered successfully. Awaiting admin approval and verification.',
      business
    });
  } catch (error) {
    console.error('❌ Business registration error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
    next(error);
  }
};

// @desc    Upload business documents
// @route   POST /api/business/:id/documents
// @access  Private (Business owner)
exports.uploadDocuments = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    if (business.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this business'
      });
    }

    // Handle file uploads
    if (req.files) {
      if (req.files.ownerIdProof) {
        business.documents.ownerIdProof = {
          url: `/uploads/${req.files.ownerIdProof[0].filename}`,
          verified: false
        };
      }
      if (req.files.foodSafetyCertificate) {
        business.documents.foodSafetyCertificate = {
          url: `/uploads/${req.files.foodSafetyCertificate[0].filename}`,
          verified: false
        };
      }
      if (req.files.businessLicense) {
        business.documents.businessLicense = {
          url: `/uploads/${req.files.businessLicense[0].filename}`,
          verified: false
        };
      }
    }

    business.kycStatus = 'in_review';
    await business.save();

    res.status(200).json({
      success: true,
      message: 'Documents uploaded successfully',
      business
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get nearby businesses
// @route   GET /api/business/nearby
// @access  Public
exports.getNearbyBusinesses = async (req, res, next) => {
  try {
    const { latitude, longitude, radius, category } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const maxDistance = parseInt(radius) || 5000; // Default 5km

    const query = {
      status: 'active',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: maxDistance
        }
      }
    };

    if (category) {
      query.category = category;
    }

    const businesses = await Business.find(query)
      .select('-documents')
      .limit(50);

    res.status(200).json({
      success: true,
      count: businesses.length,
      businesses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search businesses
// @route   GET /api/business/search
// @access  Public
exports.searchBusinesses = async (req, res, next) => {
  try {
    const { query, category, city } = req.query;
    
    const searchQuery = { status: 'active' };

    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    if (category) {
      searchQuery.category = category;
    }

    if (city) {
      searchQuery['address.city'] = { $regex: city, $options: 'i' };
    }

    const businesses = await Business.find(searchQuery)
      .select('-documents')
      .limit(50);

    res.status(200).json({
      success: true,
      count: businesses.length,
      businesses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single business
// @route   GET /api/business/:id
// @access  Public
exports.getBusiness = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id)
      .populate('owner', 'name email')
      .select('-documents');

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    res.status(200).json({
      success: true,
      business
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get business dashboard data
// @route   GET /api/business/:id/dashboard
// @access  Private (Business owner)
exports.getBusinessDashboard = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id);

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

    // Get reviews
    const reviews = await Review.find({ business: business._id })
      .populate('user', 'name profileImage')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get analytics
    const totalReviews = await Review.countDocuments({ business: business._id });
    const avgRating = await Review.aggregate([
      { $match: { business: business._id } },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);

    // Get reviews by rating
    const ratingDistribution = await Review.aggregate([
      { $match: { business: business._id } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    res.status(200).json({
      success: true,
      dashboard: {
        business,
        recentReviews: reviews,
        analytics: {
          totalReviews,
          averageRating: avgRating[0]?.avg || 0,
          ratingDistribution
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate QR code for business
// @route   POST /api/business/:id/generate-qr
// @access  Private (Business owner)
exports.generateQRCode = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    if (business.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Generate QR code
    const qrCode = await generateBusinessQRCode(business._id.toString(), business.name);
    business.qrCode = qrCode;
    await business.save();

    res.status(200).json({
      success: true,
      message: 'QR code generated successfully',
      qrCode
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update business
// @route   PUT /api/business/:id
// @access  Private (Business owner)
exports.updateBusiness = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    if (business.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const allowedUpdates = ['description', 'phone', 'openingHours', 'socialMedia'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedBusiness = await Business.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Business updated successfully',
      business: updatedBusiness
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my businesses
// @route   GET /api/business/my/businesses
// @access  Private (Business owner)
exports.getMyBusinesses = async (req, res, next) => {
  try {
    const businesses = await Business.find({ owner: req.user.id });

    res.status(200).json({
      success: true,
      count: businesses.length,
      businesses
    });
  } catch (error) {
    next(error);
  }
};

