const axios = require('axios');
const logger = require('./logger');

// Didit API Configuration
const DIDIT_API_URL = process.env.DIDIT_API_URL || 'https://api.didit.me/v1';
const DIDIT_API_KEY = process.env.DIDIT_API_KEY;
const DIDIT_SECRET_KEY = process.env.DIDIT_SECRET_KEY;

/**
 * Create a Didit verification session for document verification
 * @param {Object} businessData - Business and owner information
 * @returns {Promise<Object>} Didit session data with verification link
 */
exports.createVerificationSession = async (businessData) => {
  try {
    if (!DIDIT_API_KEY || !DIDIT_SECRET_KEY) {
      throw new Error('Didit API credentials not configured. Please add DIDIT_API_KEY and DIDIT_SECRET_KEY to environment variables.');
    }

    logger.info('Creating Didit verification session for business:', businessData.businessId);

    const response = await axios.post(
      `${DIDIT_API_URL}/verifications`,
      {
        // Verification type - document verification
        type: 'document_verification',
        
        // Business owner information
        user: {
          externalId: businessData.ownerId,
          email: businessData.email,
          name: businessData.ownerName,
          phone: businessData.phone
        },
        
        // Required documents
        documents: [
          {
            type: 'id_card', // Owner ID proof (passport, driver's license, national ID)
            required: true
          },
          {
            type: 'business_license', // Business registration/license
            required: true
          },
          {
            type: 'certificate', // Food safety certificate or other permits
            required: false
          }
        ],
        
        // Verification settings
        settings: {
          autoApprove: false, // Manual review by admin
          liveness: true, // Selfie verification to match ID
          facematch: true, // Compare selfie with ID photo
          documentCheck: true, // Verify document authenticity
          extractData: true // Extract data from documents
        },
        
        // Webhook for status updates
        webhookUrl: `${process.env.BACKEND_URL}/api/webhooks/didit`,
        
        // Callback URLs
        successUrl: `${process.env.FRONTEND_URL}/business/verification-success`,
        failureUrl: `${process.env.FRONTEND_URL}/business/verification-failed`,
        
        // Metadata
        metadata: {
          businessId: businessData.businessId,
          businessName: businessData.businessName,
          category: businessData.category,
          timestamp: new Date().toISOString()
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${DIDIT_API_KEY}`,
          'X-Secret-Key': DIDIT_SECRET_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info('Didit session created successfully:', response.data.sessionId);

    return {
      success: true,
      sessionId: response.data.sessionId,
      verificationLink: response.data.verificationUrl,
      expiresAt: response.data.expiresAt,
      status: response.data.status
    };

  } catch (error) {
    logger.error('Didit verification session creation failed:', error.response?.data || error.message);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Get verification session status from Didit
 * @param {String} sessionId - Didit session ID
 * @returns {Promise<Object>} Verification status and results
 */
exports.getVerificationStatus = async (sessionId) => {
  try {
    logger.info('Fetching Didit verification status for session:', sessionId);

    const response = await axios.get(
      `${DIDIT_API_URL}/verifications/${sessionId}`,
      {
        headers: {
          'Authorization': `Bearer ${DIDIT_API_KEY}`,
          'X-Secret-Key': DIDIT_SECRET_KEY
        }
      }
    );

    const data = response.data;

    return {
      success: true,
      sessionId: data.sessionId,
      status: data.status, // pending, in_review, verified, rejected
      documents: data.documents.map(doc => ({
        type: doc.type,
        status: doc.status,
        verificationId: doc.id,
        extractedData: doc.extractedData,
        verifiedAt: doc.verifiedAt,
        rejectionReason: doc.rejectionReason
      })),
      livenessCheck: {
        status: data.liveness?.status,
        confidence: data.liveness?.confidence
      },
      faceMatch: {
        status: data.faceMatch?.status,
        confidence: data.faceMatch?.confidence,
        similarity: data.faceMatch?.similarity
      },
      overallResult: data.result,
      completedAt: data.completedAt
    };

  } catch (error) {
    logger.error('Didit status fetch failed:', error.response?.data || error.message);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Process Didit webhook callback
 * @param {Object} webhookData - Webhook payload from Didit
 * @returns {Promise<Object>} Processed webhook data
 */
exports.processWebhook = async (webhookData) => {
  try {
    logger.info('Processing Didit webhook:', webhookData.event);

    // Verify webhook signature (security)
    const isValid = verifyWebhookSignature(webhookData);
    
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    const { event, sessionId, status, documents, metadata } = webhookData;

    return {
      success: true,
      event, // verification.started, verification.completed, document.verified, etc.
      sessionId,
      businessId: metadata.businessId,
      status,
      documents,
      timestamp: new Date()
    };

  } catch (error) {
    logger.error('Webhook processing failed:', error.message);
    
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verify Didit webhook signature for security
 * @param {Object} webhookData - Webhook payload
 * @returns {Boolean} True if signature is valid
 */
function verifyWebhookSignature(webhookData) {
  // Implement signature verification based on Didit's documentation
  // Usually involves HMAC SHA256 with your secret key
  
  const crypto = require('crypto');
  const signature = webhookData.signature;
  const payload = JSON.stringify(webhookData.data);
  
  const expectedSignature = crypto
    .createHmac('sha256', DIDIT_SECRET_KEY)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}

/**
 * Cancel a verification session
 * @param {String} sessionId - Didit session ID
 * @returns {Promise<Object>} Cancellation result
 */
exports.cancelVerification = async (sessionId) => {
  try {
    logger.info('Cancelling Didit session:', sessionId);

    const response = await axios.post(
      `${DIDIT_API_URL}/verifications/${sessionId}/cancel`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${DIDIT_API_KEY}`,
          'X-Secret-Key': DIDIT_SECRET_KEY
        }
      }
    );

    return {
      success: true,
      message: 'Verification session cancelled successfully'
    };

  } catch (error) {
    logger.error('Didit cancellation failed:', error.response?.data || error.message);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Get verification session link (for resending to user)
 * @param {String} sessionId - Didit session ID
 * @returns {Promise<String>} Verification link
 */
exports.getVerificationLink = async (sessionId) => {
  try {
    const response = await axios.get(
      `${DIDIT_API_URL}/verifications/${sessionId}/link`,
      {
        headers: {
          'Authorization': `Bearer ${DIDIT_API_KEY}`,
          'X-Secret-Key': DIDIT_SECRET_KEY
        }
      }
    );

    return response.data.verificationUrl;

  } catch (error) {
    logger.error('Failed to get verification link:', error.message);
    throw error;
  }
};

module.exports = exports;

