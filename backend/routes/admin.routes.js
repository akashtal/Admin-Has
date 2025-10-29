const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  getAllBusinesses,
  updateBusinessKYC,
  updateUserStatus,
  getAllReviews,
  updateReviewStatus,
  sendNotification,
  deleteUser,
  deleteBusiness
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes are admin-only
router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/businesses', getAllBusinesses);
router.put('/businesses/:id/kyc', updateBusinessKYC);
router.put('/users/:id/status', updateUserStatus);
router.get('/reviews', getAllReviews);
router.put('/reviews/:id/status', updateReviewStatus);
router.post('/notifications/send', sendNotification);
router.delete('/users/:id', deleteUser);
router.delete('/businesses/:id', deleteBusiness);

module.exports = router;

