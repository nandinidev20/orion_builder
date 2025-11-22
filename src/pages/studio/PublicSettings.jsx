import React, { useState } from 'react';

const PublicSettings = () => {
  const [settings, setSettings] = useState({
    studioName: 'My Studio',
    description: 'This is a sample studio description.',
    brandColor: '#3B82F6',
    isPublic: true,
    emailNotifications: true,
    analyticsSharing: true
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    // Mock API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock success response
    console.log('Mock settings saved:', settings);
    alert('Settings saved successfully (mock)');

    setIsSaving(false);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Public Studio Settings</h1>
        <p className="text-gray-600">Manage your public studio settings and preferences</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSave} className="bg-white shadow rounded-lg p-6 space-y-8">
          {/* Studio Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Studio Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="studioName" className="block text-sm font-medium text-gray-700 mb-1">
                  Studio Name
                </label>
                <input
                  type="text"
                  id="studioName"
                  name="studioName"
                  value={settings.studioName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter studio name"
                />
              </div>
              <div>
                <label htmlFor="brandColor" className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Color
                </label>
                <div className="flex items-center">
                  <input
                    type="color"
                    id="brandColor"
                    name="brandColor"
                    value={settings.brandColor}
                    onChange={handleChange}
                    className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <span className="ml-3 text-sm text-gray-600">{settings.brandColor}</span>
                </div>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={settings.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your studio"
                />
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="isPublic" className="text-sm font-medium text-gray-900">
                    Public Studio
                  </label>
                  <p className="text-sm text-gray-500">Allow anyone to view your studio and experiences</p>
                </div>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    id="isPublic"
                    name="isPublic"
                    checked={settings.isPublic}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div 
                    className={`block w-10 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                      settings.isPublic ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  ></div>
                  <div 
                    className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${
                      settings.isPublic ? 'transform translate-x-4' : ''
                    }`}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="emailNotifications" className="text-sm font-medium text-gray-900">
                    Email Notifications
                  </label>
                  <p className="text-sm text-gray-500">Receive email notifications for important updates</p>
                </div>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    name="emailNotifications"
                    checked={settings.emailNotifications}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div 
                    className={`block w-10 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                      settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  ></div>
                  <div 
                    className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${
                      settings.emailNotifications ? 'transform translate-x-4' : ''
                    }`}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Sharing Settings */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Data Sharing</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="analyticsSharing" className="text-sm font-medium text-gray-900">
                    Share Analytics Data
                  </label>
                  <p className="text-sm text-gray-500">Help improve the platform by sharing anonymous analytics</p>
                </div>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    id="analyticsSharing"
                    name="analyticsSharing"
                    checked={settings.analyticsSharing}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div 
                    className={`block w-10 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                      settings.analyticsSharing ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  ></div>
                  <div 
                    className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${
                      settings.analyticsSharing ? 'transform translate-x-4' : ''
                    }`}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PublicSettings;
