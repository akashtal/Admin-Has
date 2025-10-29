const express = require('express');
const router = express.Router();
const {
  getCoupons,
  getCoupon,
  verifyCoupon,
  redeemCoupon,
  getBusinessCoupons,
  calculateCouponDiscount
} = require('../controllers/coupon.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes are protected
router.use(protect);

router.get('/', getCoupons);
router.get('/:id', getCoupon);
router.post('/verify', authorize('business', 'admin'), verifyCoupon);
router.post('/:id/redeem', authorize('business', 'admin'), redeemCoupon);
router.get('/business/:businessId', authorize('business', 'admin'), getBusinessCoupons);
router.post('/calculate-discount', calculateCouponDiscount);

module.exports = router;

