// Generate random coupon code
exports.generateCouponCode = (length = 8) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return code;
};

// Calculate coupon expiry (2 hours from now)
exports.calculateCouponExpiry = (hours = 2) => {
  const now = new Date();
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
};

// Validate coupon
exports.isCouponValid = (coupon) => {
  if (coupon.status !== 'active') return false;
  if (new Date() > new Date(coupon.validUntil)) return false;
  return true;
};

// Get coupon discount amount
exports.calculateDiscount = (coupon, purchaseAmount) => {
  let discount = 0;

  switch (coupon.rewardType) {
    case 'discount_percentage':
      discount = (purchaseAmount * coupon.rewardValue) / 100;
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
      break;
    
    case 'discount_fixed':
      discount = Math.min(coupon.rewardValue, purchaseAmount);
      break;
    
    case 'cashback':
      discount = (purchaseAmount * coupon.rewardValue) / 100;
      break;
    
    default:
      discount = 0;
  }

  return discount;
};

