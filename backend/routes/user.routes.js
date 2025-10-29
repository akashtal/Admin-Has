const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getUserReviews,
  getUserCoupons,
  getRewardHistory,
  uploadProfileImage,
  deleteAccount
} = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate, schemas } = require('../middleware/validation');
const upload = require('../middleware/upload');

// All routes are protected
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', validate(schemas.updateProfile), updateProfile);
router.get('/reviews', getUserReviews);
router.get('/coupons', getUserCoupons);
router.get('/rewards', getRewardHistory);
router.post('/upload-image', upload.single('image'), uploadProfileImage);
router.delete('/account', deleteAccount);

module.exports = router;

