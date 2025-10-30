import React, { useState } from 'react';
import { Send, Users } from 'lucide-react';
import { adminApi } from '../api/adminApi';

const Notifications = () => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    sendToAll: true,
    userIds: []
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title || !formData.message) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await adminApi.sendNotification(formData);
      setSuccess(response.data.message);
      setFormData({ title: '', message: '', sendToAll: true, userIds: [] });
    } catch (err) {
      setError(err.response?.data?.message || 'Error sending notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Send Notifications</h1>
        <p className="text-gray-600 mt-1">Send push notifications to users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Compose Notification</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                id="title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="Enter notification title"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                id="message"
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                rows="4"
                placeholder="Enter notification message"
              />
            </div>

            <div className="flex items-center">
              <input
                id="sendToAll"
                type="checkbox"
                checked={formData.sendToAll}
                onChange={(e) => setFormData({ ...formData, sendToAll: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="sendToAll" className="ml-2 block text-sm text-gray-700">
                Send to all users
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} className="mr-2" />
              {loading ? 'Sending...' : 'Send Notification'}
            </button>
          </form>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary-600">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">HV</span>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {formData.title || 'Notification Title'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formData.message || 'Notification message will appear here...'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Just now</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recipients</h2>
            <div className="flex items-center text-gray-600">
              <Users size={20} className="mr-2" />
              <span>
                {formData.sendToAll
                  ? 'All users with push notifications enabled'
                  : 'Selected users only'}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Keep titles short and clear (max 65 chars)</li>
              <li>• Messages should be concise (max 200 chars)</li>
              <li>• Test with a small group first</li>
              <li>• Avoid sending too frequently</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;

