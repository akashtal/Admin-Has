const express = require('express');
const router = express.Router();
const {
  initiateVerification,
  getVerificationStatus,
  handleDiditWebhook,
  resendVerificationLink
} = require('../controllers/verification.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Initiate Didit verification (Business Owner or Admin)
router.post('/initiate/:businessId', protect, authorize('business', 'admin'), initiateVerification);

// Get verification status (Business Owner or Admin)
router.get('/status/:businessId', protect, authorize('business', 'admin'), getVerificationStatus);

// Resend verification link (Business Owner or Admin)
router.post('/resend/:businessId', protect, authorize('business', 'admin'), resendVerificationLink);

module.exports = router;

