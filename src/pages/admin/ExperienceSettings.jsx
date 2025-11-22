import React, { useState } from 'react';

const AdminExperienceSettings = () => {
  const [experienceData, setExperienceData] = useState({
    visibility: 'public',
    allowComments: false,
    autoPlayMedia: false,
    emailNotifications: true,
    pushNotifications: false,
    passwordProtection: false,
    password: '',
    twoFactorAuth: false,
    trackInteractions: true,
    shareAnonymousData: false,
  });

  const handleSettingChange = (field, value) => {
    setExperienceData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Experience Settings</h1>
        <p className="text-gray-600 mt-1">Configure global experience settings</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* General Settings */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">General Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Visibility</label>
              <select
                value={experienceData.visibility}
                onChange={(e) => handleSettingChange('visibility', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="unlisted">Unlisted</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={experienceData.allowComments}
                onChange={(e) => handleSettingChange('allowComments', e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm text-gray-700">Allow Comments on Experiences</span>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={experienceData.autoPlayMedia}
                onChange={(e) => handleSettingChange('autoPlayMedia', e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm text-gray-700">Auto-play Media When Stage Loads</span>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="mb-8 pb-8 border-b border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={experienceData.emailNotifications}
                onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm text-gray-700">Send Email Notifications for New Comments</span>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={experienceData.pushNotifications}
                onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm text-gray-700">Send Push Notifications for New Comments</span>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="mb-8 pb-8 border-b border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Security</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={experienceData.passwordProtection}
                onChange={(e) => handleSettingChange('passwordProtection', e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm text-gray-700">Require Password Protection</span>
            </div>

            {experienceData.passwordProtection && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={experienceData.password}
                  onChange={(e) => handleSettingChange('password', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter password"
                />
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={experienceData.twoFactorAuth}
                onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm text-gray-700">Require Two-Factor Authentication</span>
            </div>
          </div>
        </div>

        {/* Analytics Settings */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Analytics</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={experienceData.trackInteractions}
                onChange={(e) => handleSettingChange('trackInteractions', e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm text-gray-700">Track User Interactions</span>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={experienceData.shareAnonymousData}
                onChange={(e) => handleSettingChange('shareAnonymousData', e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm text-gray-700">Share Anonymous Data for Research</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            Cancel
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminExperienceSettings;
