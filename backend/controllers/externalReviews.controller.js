const Business = require('../models/Business.model');
const axios = require('axios');

// @desc    Sync Google Reviews
// @route   POST /api/business/:id/sync-google-reviews
// @access  Private (Business Owner or Admin)
exports.syncGoogleReviews = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    // Verify ownership
    if (req.user.role !== 'admin' && business.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to sync reviews for this business'
      });
    }

    const googleBusinessName = business.externalProfiles?.googleBusiness?.businessName;
    let googlePlaceId = business.externalProfiles?.googleBusiness?.placeId;

    if (!googleBusinessName && !googlePlaceId) {
      return res.status(400).json({
        success: false,
        message: 'Google Business name or Place ID not configured. Please provide your Google Business name (e.g., "Your Business Name, City") in business registration.'
      });
    }

    let placeId = googlePlaceId;

    // If no Place ID, search using business name
    if (!placeId) {
      console.log('🔍 Searching for business on Google:', googleBusinessName);
      
      const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json`;
      const findPlaceResponse = await axios.get(findPlaceUrl, {
        params: {
          input: `${googleBusinessName} ${business.address?.fullAddress || ''}`,
          inputtype: 'textquery',
          fields: 'place_id,name,formatted_address',
          key: process.env.GOOGLE_PLACES_API_KEY
        }
      });

      console.log('🔍 Google Places API response:', findPlaceResponse.data);

      if (!findPlaceResponse.data.candidates || findPlaceResponse.data.candidates.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Business not found on Google. Please check your Google Business name. Searched for: "${googleBusinessName}"`,
          suggestion: 'Try entering just your business name without address (e.g., "THAITASTIC" instead of full URL)'
        });
      }

      placeId = findPlaceResponse.data.candidates[0].place_id;
      console.log('✅ Found Place ID:', placeId);
    }

    // Google Places API - Get Place Details (including reviews)
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json`;
    const detailsResponse = await axios.get(detailsUrl, {
      params: {
        place_id: placeId,
        fields: 'name,rating,user_ratings_total,reviews',
        key: process.env.GOOGLE_PLACES_API_KEY
      }
    });

    const placeDetails = detailsResponse.data.result;

    // Format Google reviews
    const googleReviews = (placeDetails.reviews || []).map(review => ({
      reviewId: review.time.toString(),
      author: review.author_name,
      authorPhoto: review.profile_photo_url,
      rating: review.rating,
      text: review.text,
      date: new Date(review.time * 1000),
      relativeTime: review.relative_time_description
    }));

    // Update business with Google data
    business.externalProfiles.googleBusiness = {
      businessName: googleBusinessName,
      placeId: placeId,
      rating: placeDetails.rating,
      reviewCount: placeDetails.user_ratings_total,
      lastSynced: new Date()
    };

    business.externalReviews.google = googleReviews;

    await business.save();

    res.status(200).json({
      success: true,
      message: 'Google reviews synced successfully',
      data: {
        rating: placeDetails.rating,
        reviewCount: placeDetails.user_ratings_total,
        reviews: googleReviews
      }
    });

  } catch (error) {
    console.error('Google Reviews sync error:', error);
    
    if (error.response?.data?.error_message) {
      return res.status(400).json({
        success: false,
        message: error.response.data.error_message
      });
    }

    next(error);
  }
};

// @desc    Sync TripAdvisor Reviews (Manual or via API if available)
// @route   POST /api/business/:id/sync-tripadvisor-reviews
// @access  Private (Business Owner or Admin)
exports.syncTripAdvisorReviews = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    // Verify ownership
    if (req.user.role !== 'admin' && business.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to sync reviews for this business'
      });
    }

    const tripAdvisorUrl = business.externalProfiles?.tripAdvisor?.profileUrl;

    if (!tripAdvisorUrl) {
      return res.status(400).json({
        success: false,
        message: 'TripAdvisor profile URL not configured for this business'
      });
    }

    // NOTE: TripAdvisor Content API requires partnership
    // For now, this is a placeholder for manual entry or web scraping (not recommended)
    
    // Option 1: Manual entry via admin panel
    // Option 2: TripAdvisor API (requires Content API access)
    // Option 3: Web scraping (against TOS, not recommended)

    return res.status(200).json({
      success: true,
      message: 'TripAdvisor integration is under development. Please contact admin for manual review import.',
      data: {
        profileUrl: tripAdvisorUrl,
        note: 'TripAdvisor API access requires partnership. Reviews can be manually added by admin.'
      }
    });

  } catch (error) {
    console.error('TripAdvisor sync error:', error);
    next(error);
  }
};

// @desc    Get all reviews (internal + external)
// @route   GET /api/business/:id/all-reviews
// @access  Public
exports.getAllReviews = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    // Get internal HashView reviews
    const Review = require('../models/Review.model');
    const internalReviews = await Review.find({ business: req.params.id })
      .populate('user', 'name profileImage')
      .sort({ createdAt: -1 });

    // Format all reviews into a unified structure
    const allReviews = {
      internal: {
        source: 'HashView',
        count: internalReviews.length,
        averageRating: business.rating.average,
        reviews: internalReviews.map(review => ({
          id: review._id,
          source: 'hashview',
          author: review.user?.name || 'Anonymous',
          authorPhoto: review.user?.profileImage,
          rating: review.rating,
          text: review.comment,
          date: review.createdAt,
          verified: review.verified
        }))
      },
      google: {
        source: 'Google',
        count: business.externalProfiles?.googleBusiness?.reviewCount || 0,
        averageRating: business.externalProfiles?.googleBusiness?.rating || 0,
        lastSynced: business.externalProfiles?.googleBusiness?.lastSynced,
        reviews: (business.externalReviews?.google || []).map(review => ({
          id: review.reviewId,
          source: 'google',
          author: review.author,
          authorPhoto: review.authorPhoto,
          rating: review.rating,
          text: review.text,
          date: review.date,
          relativeTime: review.relativeTime
        }))
      },
      tripAdvisor: {
        source: 'TripAdvisor',
        count: business.externalProfiles?.tripAdvisor?.reviewCount || 0,
        averageRating: business.externalProfiles?.tripAdvisor?.rating || 0,
        lastSynced: business.externalProfiles?.tripAdvisor?.lastSynced,
        reviews: (business.externalReviews?.tripAdvisor || []).map(review => ({
          id: review.reviewId,
          source: 'tripadvisor',
          author: review.author,
          rating: review.rating,
          text: review.text,
          date: review.date,
          url: review.url
        }))
      },
      summary: {
        totalReviews: internalReviews.length + 
          (business.externalReviews?.google?.length || 0) + 
          (business.externalReviews?.tripAdvisor?.length || 0),
        averageRating: calculateOverallRating(business, internalReviews)
      }
    };

    res.status(200).json({
      success: true,
      data: allReviews
    });

  } catch (error) {
    console.error('Get all reviews error:', error);
    next(error);
  }
};

// Helper function to calculate overall rating
function calculateOverallRating(business, internalReviews) {
  let totalRating = 0;
  let totalCount = 0;

  // Internal reviews
  if (internalReviews.length > 0) {
    totalRating += business.rating.average * internalReviews.length;
    totalCount += internalReviews.length;
  }

  // Google reviews
  const googleCount = business.externalProfiles?.googleBusiness?.reviewCount || 0;
  const googleRating = business.externalProfiles?.googleBusiness?.rating || 0;
  if (googleCount > 0) {
    totalRating += googleRating * googleCount;
    totalCount += googleCount;
  }

  // TripAdvisor reviews
  const tripAdvisorCount = business.externalProfiles?.tripAdvisor?.reviewCount || 0;
  const tripAdvisorRating = business.externalProfiles?.tripAdvisor?.rating || 0;
  if (tripAdvisorCount > 0) {
    totalRating += tripAdvisorRating * tripAdvisorCount;
    totalCount += tripAdvisorCount;
  }

  return totalCount > 0 ? (totalRating / totalCount).toFixed(1) : 0;
}

