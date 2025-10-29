const QRCode = require('qrcode');

// Generate QR code for business
exports.generateBusinessQRCode = async (businessId, businessName) => {
  try {
    const qrData = {
      type: 'business',
      id: businessId,
      name: businessName,
      timestamp: new Date().toISOString()
    };

    const qrCodeString = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1
    });

    return qrCodeString;
  } catch (error) {
    throw new Error('Failed to generate QR code: ' + error.message);
  }
};

// Generate QR code for coupon
exports.generateCouponQRCode = async (couponCode, couponData) => {
  try {
    const qrData = {
      type: 'coupon',
      code: couponCode,
      ...couponData,
      timestamp: new Date().toISOString()
    };

    const qrCodeString = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1
    });

    return qrCodeString;
  } catch (error) {
    throw new Error('Failed to generate QR code: ' + error.message);
  }
};

// Verify QR code data
exports.verifyQRCode = (qrData) => {
  try {
    const parsed = JSON.parse(qrData);
    return {
      valid: true,
      data: parsed
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid QR code data'
    };
  }
};

