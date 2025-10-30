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
  updateBusinessKYC: (businessId, action, reason) => 
    api.put(`/admin/businesses/${businessId}/kyc`, { action, reason }),
  deleteBusiness: (businessId) => api.delete(`/admin/businesses/${businessId}`),
  
  // Reviews
  getAllReviews: (params) => api.get('/admin/reviews', { params }),
  updateReviewStatus: (reviewId, status) => 
    api.put(`/admin/reviews/${reviewId}/status`, { status }),
  
  // Notifications
  sendNotification: (data) => api.post('/admin/notifications/send', data),
};

export default adminApi;

