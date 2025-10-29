const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Profile Image Storage
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hashview/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 500, height: 500, crop: 'fill', gravity: 'face' },
      { quality: 'auto' }
    ]
  }
});

// Business Logo Storage
const businessLogoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hashview/business/logos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    transformation: [
      { width: 400, height: 400, crop: 'fill' },
      { quality: 'auto' }
    ]
  }
});

// Business Cover Image Storage
const businessCoverStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hashview/business/covers',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1200, height: 600, crop: 'fill' },
      { quality: 'auto' }
    ]
  }
});

// Business Documents Storage (KYC, licenses, etc.)
const businessDocumentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hashview/business/documents',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto' // Allows both images and PDFs
  }
});

// Business Gallery Storage (multiple photos of restaurant/business)
const businessGalleryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hashview/business/gallery',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1024, height: 768, crop: 'limit' }, // Limit max size but preserve aspect ratio
      { quality: 'auto' }
    ]
  }
});

// Create multer instances
const uploadProfile = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

const uploadBusinessLogo = multer({
  storage: businessLogoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

const uploadBusinessCover = multer({
  storage: businessCoverStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

const uploadBusinessDocuments = multer({
  storage: businessDocumentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB per document
  }
});

const uploadBusinessGallery = multer({
  storage: businessGalleryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB per image
  }
});

module.exports = {
  cloudinary,
  uploadProfile,
  uploadBusinessLogo,
  uploadBusinessCover,
  uploadBusinessDocuments,
  uploadBusinessGallery
};

