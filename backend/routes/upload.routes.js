const express = require('express');
const router = express.Router();
const {
  uploadProfileImage,
  uploadBusinessLogo,
  uploadBusinessCover,
  uploadBusinessDocuments,
  uploadBusinessGallery,
  uploadReviewPhotos,
  uploadReviewVideos,
  deleteFile,
  getUploadStats
} = require('../controllers/upload.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Profile image upload (all authenticated users)
router.post('/profile', protect, uploadProfileImage);

// Business-specific uploads (business owners only)
router.post('/business/logo', protect, authorize('business'), uploadBusinessLogo);
router.post('/business/cover', protect, authorize('business'), uploadBusinessCover);
router.post('/business/documents', protect, authorize('business'), uploadBusinessDocuments);
router.post('/business/gallery', protect, authorize('business'), uploadBusinessGallery);

// Admin uploads (admin can upload for any business)
router.post('/admin/business/logo', protect, authorize('admin'), uploadBusinessLogo);
router.post('/admin/business/cover', protect, authorize('admin'), uploadBusinessCover);
router.post('/admin/business/gallery', protect, authorize('admin'), uploadBusinessGallery);

// Review media uploads (customers only)
router.post('/review/photos', protect, uploadReviewPhotos);
router.post('/review/videos', protect, uploadReviewVideos);

// Delete file (owner or admin)
router.delete('/:publicId', protect, deleteFile);

// Upload statistics (admin only)
router.get('/stats', protect, authorize('admin'), getUploadStats);

module.exports = router;

