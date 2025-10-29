const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    minlength: [2, 'Business name must be at least 2 characters'],
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Business email is required'],
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Business phone is required']
  },
  category: {
    type: String,
    required: [true, 'Business category is required'],
    enum: ['restaurant', 'cafe', 'retail', 'services', 'healthcare', 'education', 'entertainment', 'salon', 'hotel', 'gym', 'other']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    fullAddress: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function(v) {
          return Array.isArray(v) && v.length === 2 && 
                 v[0] >= -180 && v[0] <= 180 && // longitude
                 v[1] >= -90 && v[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates. Longitude must be between -180 and 180, Latitude must be between -90 and 90'
      }
    }
  },
  radius: {
    type: Number,
    default: 50, // 50 meters default radius for geofencing
    min: 10,
    max: 500
  },
  images: [{
    url: String,
    publicId: String
  }],
  logo: {
    url: String,
    publicId: String
  },
  coverImage: {
    url: String,
    publicId: String
  },
  documents: {
    ownerIdProof: {
      url: String,
      publicId: String,
      verified: {
        type: Boolean,
        default: false
      },
      diditVerificationId: String,
      diditVerificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected', 'not_submitted'],
        default: 'not_submitted'
      },
      diditVerifiedAt: Date
    },
    foodSafetyCertificate: {
      url: String,
      publicId: String,
      verified: {
        type: Boolean,
        default: false
      },
      diditVerificationId: String,
      diditVerificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected', 'not_submitted'],
        default: 'not_submitted'
      },
      diditVerifiedAt: Date
    },
    businessLicense: {
      url: String,
      publicId: String,
      verified: {
        type: Boolean,
        default: false
      },
      diditVerificationId: String,
      diditVerificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected', 'not_submitted'],
        default: 'not_submitted'
      },
      diditVerifiedAt: Date
    }
  },
  kycStatus: {
    type: String,
    enum: ['pending', 'in_review', 'approved', 'rejected'],
    default: 'pending'
  },
  diditSessionId: String, // Didit verification session ID
  diditVerificationLink: String, // Didit verification URL for business owner
  videoCallVerified: {
    type: Boolean,
    default: false
  },
  videoCallScheduledAt: Date,
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive', 'suspended', 'rejected'],
    default: 'pending'
  },
  qrCode: {
    type: String,
    default: null
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  openingHours: {
    monday: { open: String, close: String, closed: Boolean },
    tuesday: { open: String, close: String, closed: Boolean },
    wednesday: { open: String, close: String, closed: Boolean },
    thursday: { open: String, close: String, closed: Boolean },
    friday: { open: String, close: String, closed: Boolean },
    saturday: { open: String, close: String, closed: Boolean },
    sunday: { open: String, close: String, closed: Boolean }
  },
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String,
    website: String
  },
  externalProfiles: {
    tripAdvisor: {
      profileUrl: String,
      rating: Number,
      reviewCount: Number,
      lastSynced: Date
    },
    googleBusiness: {
      businessName: String,
      placeId: String, // Google Place ID
      rating: Number,
      reviewCount: Number,
      lastSynced: Date
    }
  },
  externalReviews: {
    tripAdvisor: [{
      reviewId: String,
      author: String,
      rating: Number,
      text: String,
      date: Date,
      url: String
    }],
    google: [{
      reviewId: String,
      author: String,
      authorPhoto: String,
      rating: Number,
      text: String,
      date: Date,
      relativeTime: String
    }]
  },
  rejectionReason: String,
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for geospatial queries
businessSchema.index({ location: '2dsphere' }, { sparse: true });
businessSchema.index({ owner: 1 });
businessSchema.index({ category: 1 });
businessSchema.index({ status: 1 });

module.exports = mongoose.model('Business', businessSchema);

