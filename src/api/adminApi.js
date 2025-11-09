import api from './axios';

export const adminApi = {
  // Auth
  login: (credentials) => api.post('/auth/login', credentials),
  
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard'),
  
  // Users
  getAllUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (userId, status) => api.put(`/admin/users/${userId}/status`, { status }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  
  // Businesses
  getAllBusinesses: (params) => api.get('/admin/businesses', { params }),
  getBusinessById: (businessId) => api.get(`/admin/businesses/${businessId}`),
  createBusiness: (data) => api.post('/admin/businesses', data),
  updateBusiness: (businessId, data) => api.put(`/admin/businesses/${businessId}`, data),
  updateBusinessKYC: (businessId, action, reason) => 
    api.put(`/admin/businesses/${businessId}/kyc`, { action, reason }),
  updateBusinessRadius: (businessId, radius) => 
    api.put(`/admin/businesses/${businessId}/radius`, { radius }),
  generateBusinessQRCode: (businessId) => 
    api.post(`/admin/businesses/${businessId}/generate-qr`),
  deleteBusiness: (businessId) => api.delete(`/admin/businesses/${businessId}`),
  
  // Reviews
  getAllReviews: (params) => api.get('/admin/reviews', { params }),
  updateReviewStatus: (reviewId, status) => 
    api.put(`/admin/reviews/${reviewId}/status`, { status }),
  
  // Notifications
  sendNotification: (data) => api.post('/admin/notifications/send', data),
  
  // Categories
  getAllCategories: () => api.get('/categories'),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (categoryId, data) => api.put(`/categories/${categoryId}`, data),
  deleteCategory: (categoryId) => api.delete(`/categories/${categoryId}`),
  
  // Coupons
  getAllCoupons: () => api.get('/admin/coupons'),
  toggleCouponStatus: (couponId, isActive) => api.put(`/admin/coupons/${couponId}/status`, { isActive }),
  deleteCoupon: (couponId) => api.delete(`/admin/coupons/${couponId}`),
  
  // TripAdvisor
  updateTripAdvisorRating: (businessId, rating, reviewCount) => 
    api.put(`/business/${businessId}/tripadvisor-rating`, { rating, reviewCount }),
};

export default adminApi;

