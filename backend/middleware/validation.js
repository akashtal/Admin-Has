const Joi = require('joi');

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    next();
  };
};

// Validation schemas
const schemas = {
  // Auth validations
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('customer', 'business').default('customer')
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  loginWithPhone: Joi.object({
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
    otp: Joi.string().length(6).required()
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required()
  }),

  resetPasswordOTP: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),

  // Review validation
  createReview: Joi.object({
    business: Joi.string().required(),
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().min(10).max(500).required(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  }),

  // Business validation
  createBusiness: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    ownerName: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    category: Joi.string().valid('restaurant', 'cafe', 'retail', 'services', 'healthcare', 'education', 'entertainment', 'salon', 'hotel', 'gym', 'other').required(),
    description: Joi.string().max(500),
    address: Joi.alternatives().try(
      Joi.string().required(),
      Joi.object({
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        country: Joi.string().required(),
        zipCode: Joi.string().required()
      })
    ).required(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    radius: Joi.number().min(10).max(500).default(50),
    // Opening hours
    openingHours: Joi.object().pattern(
      Joi.string(),
      Joi.object({
        open: Joi.string().optional(),
        close: Joi.string().optional(),
        closed: Joi.boolean().optional()
      })
    ).optional(),
    // Social media and external profiles (optional)
    website: Joi.string().allow('', null),
    tripAdvisorUrl: Joi.string().allow('', null),
    tripAdvisorLink: Joi.string().allow('', null),
    googleBusinessName: Joi.string().allow('', null),
    facebook: Joi.string().allow('', null),
    instagram: Joi.string().allow('', null),
    twitter: Joi.string().allow('', null)
  }),

  // Update profile validation
  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/),
    location: Joi.object({
      latitude: Joi.number().min(-90).max(90),
      longitude: Joi.number().min(-180).max(180),
      address: Joi.string()
    })
  })
};

module.exports = { validate, schemas };

