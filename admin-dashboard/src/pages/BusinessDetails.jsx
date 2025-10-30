import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, MapPin, Phone, Mail, Globe, Star } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { format } from 'date-fns';

const BusinessDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchBusinessDetails();
  }, [id]);

  const fetchBusinessDetails = async () => {
    try {
      const response = await adminApi.getAllBusinesses({ search: id });
      if (response.data.businesses.length > 0) {
        setBusiness(response.data.businesses[0]);
      }
    } catch (error) {
      console.error('Error fetching business:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKYCAction = async (action) => {
    if (action === 'reject' && !reason) {
      alert('Please provide a reason for rejection');
      return;
    }

    if (!confirm(`Are you sure you want to ${action} this business?`)) return;

    setActionLoading(true);
    try {
      await adminApi.updateBusinessKYC(id, action, reason);
      alert(`Business ${action}ed successfully!`);
      fetchBusinessDetails();
      setReason('');
    } catch (error) {
      alert(`Error ${action}ing business`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Business not found</p>
        <button
          onClick={() => navigate('/businesses')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          Back to Businesses
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <button
          onClick={() => navigate('/businesses')}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
          <p className="text-gray-600 mt-1">Business Details & Verification</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <MapPin className="text-gray-400 mt-1 mr-3" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-gray-900">{business.address?.fullAddress || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Mail className="text-gray-400 mt-1 mr-3" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900">{business.email}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Phone className="text-gray-400 mt-1 mr-3" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-gray-900">{business.phone}</p>
                </div>
              </div>
              {business.socialMedia?.website && (
                <div className="flex items-start">
                  <Globe className="text-gray-400 mt-1 mr-3" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Website</p>
                    <a
                      href={business.socialMedia.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      {business.socialMedia.website}
                    </a>
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-gray-900 mt-1">{business.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="text-gray-900 capitalize">{business.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rating</p>
                  <div className="flex items-center">
                    <Star className="text-yellow-500 fill-current mr-1" size={16} />
                    <span className="text-gray-900">
                      {business.rating?.average?.toFixed(1) || '0.0'} ({business.reviewCount || 0} reviews)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Verification Documents</h2>
            
            {/* Owner Selfie - Full Width */}
            {business.selfieUrl && (
              <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-blue-50">
                <h3 className="font-medium text-gray-900 mb-2">📸 Owner Selfie (Face Match)</h3>
                <div className="flex justify-center">
                  <a
                    href={business.selfieUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={business.selfieUrl}
                      alt="Owner Selfie"
                      className="h-48 w-auto object-cover rounded-lg shadow-md"
                    />
                  </a>
                </div>
                <p className="text-xs text-center text-gray-600 mt-2">
                  Used for face matching with ID proof
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Owner ID Proof */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Owner ID Proof</h3>
                {business.documents?.ownerIdProof?.url ? (
                  <a
                    href={business.documents.ownerIdProof.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={business.documents.ownerIdProof.url}
                      alt="ID Proof"
                      className="w-full h-32 object-cover rounded"
                    />
                  </a>
                ) : (
                  <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                    No document
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Didit Status: {business.documents?.ownerIdProof?.diditVerificationStatus || 'N/A'}
                </p>
              </div>

              {/* Food Safety Certificate */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Food Safety Certificate</h3>
                {business.documents?.foodSafetyCertificate?.url ? (
                  <a
                    href={business.documents.foodSafetyCertificate.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={business.documents.foodSafetyCertificate.url}
                      alt="Food Safety"
                      className="w-full h-32 object-cover rounded"
                    />
                  </a>
                ) : (
                  <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                    No document
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Didit Status: {business.documents?.foodSafetyCertificate?.diditVerificationStatus || 'N/A'}
                </p>
              </div>

              {/* Business License */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Business License</h3>
                {business.documents?.businessLicense?.url ? (
                  <a
                    href={business.documents.businessLicense.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={business.documents.businessLicense.url}
                      alt="License"
                      className="w-full h-32 object-cover rounded"
                    />
                  </a>
                ) : (
                  <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                    No document
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Didit Status: {business.documents?.businessLicense?.diditVerificationStatus || 'N/A'}
                </p>
              </div>
            </div>
            
            {/* Submission Info */}
            {business.submittedForReviewAt && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  📅 Submitted for review: {format(new Date(business.submittedForReviewAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Business Status</p>
                <span
                  className={`inline-block px-3 py-1 text-sm font-medium rounded-full mt-1 ${
                    business.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : business.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {business.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">KYC Status</p>
                <span
                  className={`inline-block px-3 py-1 text-sm font-medium rounded-full mt-1 ${
                    business.kycStatus === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : business.kycStatus === 'in_review'
                      ? 'bg-blue-100 text-blue-800'
                      : business.kycStatus === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {business.kycStatus}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Registered</p>
                <p className="text-gray-900 mt-1">
                  {format(new Date(business.createdAt), 'MMM dd, yyyy')}
                </p>
              </div>
              {business.verifiedAt && (
                <div>
                  <p className="text-sm text-gray-500">Verified</p>
                  <p className="text-gray-900 mt-1">
                    {format(new Date(business.verifiedAt), 'MMM dd, yyyy')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Owner Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Owner Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-gray-900">{business.owner?.name || business.ownerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-900">{business.owner?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-gray-900">{business.owner?.phone}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          {business.kycStatus === 'in_review' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">KYC Actions</h2>
              <div className="space-y-4">
                <button
                  onClick={() => handleKYCAction('approve')}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                >
                  <CheckCircle size={20} className="mr-2" />
                  Approve Business
                </button>

                <div>
                  <textarea
                    placeholder="Reason for rejection (required)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    rows="3"
                  />
                  <button
                    onClick={() => handleKYCAction('reject')}
                    disabled={actionLoading || !reason}
                    className="w-full mt-2 flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                  >
                    <XCircle size={20} className="mr-2" />
                    Reject Business
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessDetails;

