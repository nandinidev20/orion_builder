import React from 'react';
import { useState, useEffect } from 'react';
import { Check, X, Loader2, AlertCircle, Edit2, Save } from 'lucide-react';
import { getUserTimezone } from '../../../utils/timezoneHelper';

const SessionSettings = ({ experienceData, updateExperienceData, experienceNameValidation }) => {
  const [errors, setErrors] = useState({});
  const [scheduleError, setScheduleError] = useState(null);
  const [slugEditable, setSlugEditable] = useState(false);
  const [tempSlug, setTempSlug] = useState(experienceData?.slug || '');

  // Generate slug from title
  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  // Auto-update slug when title changes (unless in edit mode)
  useEffect(() => {
    if (!slugEditable && experienceData?.title) {
      const newSlug = generateSlug(experienceData.title);
      setTempSlug(newSlug);
      updateExperienceData('slug', newSlug);
    }
  }, [experienceData?.title, slugEditable]);

  // Initialize slug and timezone on mount if not already set
  useEffect(() => {
    if (!experienceData?.slug && experienceData?.title) {
      const newSlug = generateSlug(experienceData.title);
      setTempSlug(newSlug);
      updateExperienceData('slug', newSlug);
    } else if (experienceData?.slug) {
      setTempSlug(experienceData.slug);
    }

    // Auto-detect and set user's timezone on mount if not already set
    if (!experienceData?.userTimezone) {
      const detectedTimezone = getUserTimezone();
      updateExperienceData('userTimezone', detectedTimezone);
    }
  }, []);

  const handleBasicInfoChange = (field, value) => {
    updateExperienceData(field, value);

    // Sync title with validation hook if field is title
    if (field === 'title' && experienceNameValidation) {
      experienceNameValidation.setValue(value);
    }

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };
  
  const handleIconUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create a preview URL for the uploaded image
      const previewUrl = URL.createObjectURL(file);
      // Store both the file object and preview URL in the experience data
      updateExperienceData('icon', file); // Store the actual File object for upload
      updateExperienceData('iconPreview', previewUrl); // Store preview URL for display
      updateExperienceData('iconName', file.name); // Store the file name separately
    }
  };

  const validateTimeRange = (startDate, startTime, endDate, endTime) => {
    // Only validate if all fields are filled
    if (!startDate || !startTime || !endDate || !endTime) {
      return null; // No error if fields are empty (will be caught by required validation)
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    // Check if dates are valid
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return 'Invalid date or time format';
    }

    // Check if start time is before end time
    if (startDateTime >= endDateTime) {
      return 'Start date and time must be before end date and time';
    }

    return null;
  };

  const handleSessionSettingsChange = (field, value) => {
    updateExperienceData(field, value);

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Validate time range if any time field is being updated
    if (['startDate', 'startTime', 'endDate', 'endTime'].includes(field)) {
      const updatedData = { ...experienceData, [field]: value };
      const timeError = validateTimeRange(
        updatedData.startDate,
        updatedData.startTime,
        updatedData.endDate,
        updatedData.endTime
      );
      setScheduleError(timeError);
    }
  };

  const handleEndScreenChange = (field, value) => {
    updateExperienceData(field, value);
  };

  // Destructure the experienceData for easier access
  const {
    title = '',
    subtitle = '',
    description = '',
    icon = null,
    iconPreview = null,
    startDate = '',
    startTime = '',
    endDate = '',
    endTime = '',
    completionTitle = '',
    completionDescription = '',
    userTimezone = ''
  } = experienceData || {};

  // Determine the icon URL to display
  // Use iconPreview if available (newly uploaded file), otherwise use icon if it's a string (existing file path)
  const iconDisplayUrl = iconPreview || (typeof icon === 'string' && icon ? icon : null);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200 p-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-lg p-2 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Session Settings</h3>
            <p className="text-sm text-gray-600">Configure your experience details</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Basic Information Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
            </svg>
            <h4 className="text-md font-bold text-gray-800">Basic Information</h4>
          </div>
          
          <div className="space-y-4">
            {/* Icon Upload */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Experience Icon</label>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 bg-white rounded-xl flex items-center justify-center shadow-md overflow-hidden border-2 border-gray-200 group">
                  {iconDisplayUrl ? (
                    <img
                      src={iconDisplayUrl}
                      alt="Experience Icon"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 group-hover:text-gray-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={handleIconUpload}
                    className="block w-full text-sm text-gray-600
                      file:mr-4 file:py-2.5 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-purple-50 file:text-purple-700
                      hover:file:bg-purple-100 file:cursor-pointer
                      cursor-pointer border border-gray-300 rounded-lg"
                  />
                  <p className="mt-2 text-xs text-gray-500">Recommended: 512x512px, PNG or JPG</p>
                </div>
              </div>
            </div>
            
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Experience Title <span className="text-red-500">*</span>
              </label>
              <div className={`flex items-center px-4 py-3 border-2 rounded-lg transition-all ${
                experienceNameValidation?.isValid === true
                  ? 'border-green-300 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200'
                  : experienceNameValidation?.isValid === false
                  ? 'border-red-300 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-200'
                  : 'border-gray-300 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-200'
              }`}>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleBasicInfoChange('title', e.target.value)}
                  placeholder="Enter a compelling title"
                  className="flex-1 outline-none bg-transparent text-sm"
                />
                {experienceNameValidation?.isChecking && (
                  <Loader2 className="w-5 h-5 text-purple-600 ml-2 animate-spin flex-shrink-0" />
                )}
                {experienceNameValidation?.isValid === true && (
                  <Check className="w-5 h-5 text-green-600 ml-2 flex-shrink-0" />
                )}
                {experienceNameValidation?.isValid === false && (
                  <X className="w-5 h-5 text-red-600 ml-2 flex-shrink-0" />
                )}
              </div>
              {experienceNameValidation?.error && (
                <p className="text-red-600 text-xs mt-2">{experienceNameValidation.error}</p>
              )}
              {experienceNameValidation?.isValid === true && (
                <p className="text-green-600 text-xs mt-2">✓ Experience title is available</p>
              )}
            </div>

            {/* URL Slug */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Experience URL
                </label>
                {!slugEditable && (
                  <button
                    type="button"
                    onClick={() => setSlugEditable(true)}
                    className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                )}
              </div>
              {!slugEditable ? (
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <code className="text-xs text-gray-600 flex-1">
                    /experiences/<span className="font-semibold text-gray-800">{tempSlug || 'your-url'}</span>
                  </code>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempSlug}
                    onChange={(e) => setTempSlug(e.target.value.toLowerCase().replace(/[^\w-]/g, '').replace(/\s+/g, '-'))}
                    placeholder="experience-url"
                    className="flex-1 px-4 py-3 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      updateExperienceData('slug', tempSlug || generateSlug(experienceData.title));
                      setSlugEditable(false);
                    }}
                    className="px-4 py-3 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-2 flex-shrink-0"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              )}
              <p className="text-gray-500 text-xs mt-2">This will be the public URL for your experience</p>
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Experience Subtitle
              </label>
              <input 
                type="text"
                value={subtitle}
                onChange={(e) => handleBasicInfoChange('subtitle', e.target.value)}
                placeholder="Add a brief subtitle"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea 
                value={description}
                onChange={(e) => handleBasicInfoChange('description', e.target.value)}
                placeholder="Describe what participants will experience"
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Session Schedule Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <h4 className="text-md font-bold text-gray-800">Session Schedule</h4>
          </div>

          <div className="space-y-4">
            {/* Start Date/Time */}
            <div className={`bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border-2 transition-colors ${
              errors.startDate || errors.startTime ? 'border-red-300 bg-red-50' : 'border-green-100'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-gray-700">Start Time <span className="text-red-500">*</span></span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleSessionSettingsChange('startDate', e.target.value)}
                    className={`w-full px-3 py-2.5 border-2 rounded-lg text-sm transition-all ${
                      errors.startDate
                        ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent'
                    }`}
                  />
                  {errors.startDate && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.startDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Time <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => handleSessionSettingsChange('startTime', e.target.value)}
                    className={`w-full px-3 py-2.5 border-2 rounded-lg text-sm transition-all ${
                      errors.startTime
                        ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent'
                    }`}
                  />
                  {errors.startTime && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.startTime}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* End Date/Time */}
            <div className={`bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 border-2 transition-colors ${
              errors.endDate || errors.endTime ? 'border-red-300 bg-red-50' : 'border-red-100'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-gray-700">End Time <span className="text-red-500">*</span></span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => handleSessionSettingsChange('endDate', e.target.value)}
                    className={`w-full px-3 py-2.5 border-2 rounded-lg text-sm transition-all ${
                      errors.endDate
                        ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent'
                    }`}
                  />
                  {errors.endDate && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.endDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Time <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => handleSessionSettingsChange('endTime', e.target.value)}
                    className={`w-full px-3 py-2.5 border-2 rounded-lg text-sm transition-all ${
                      errors.endTime
                        ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50'
                        : 'border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent'
                    }`}
                  />
                  {errors.endTime && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.endTime}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Schedule Validation Error */}
            {scheduleError && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-lg">
                <p className="text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {scheduleError}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* End Screen Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <h4 className="text-md font-bold text-gray-800">Completion Screen</h4>
          </div>
          
          <div className="space-y-4">
            {/* Completion Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Completion Title
              </label>
              <input 
                type="text"
                value={completionTitle}
                onChange={(e) => handleEndScreenChange('completionTitle', e.target.value)}
                placeholder="Congratulations! You've completed..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            
            {/* Completion Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Completion Message
              </label>
              <textarea 
                value={completionDescription}
                onChange={(e) => handleEndScreenChange('completionDescription', e.target.value)}
                placeholder="Thank you for participating! Here's what happens next..."
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Preview Card */}
            <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-semibold text-gray-700">Completion Preview</span>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h5 className="font-bold text-gray-900 mb-2">
                  {completionTitle || 'Your completion title will appear here'}
                </h5>
                <p className="text-sm text-gray-600">
                  {completionDescription || 'Your completion message will appear here'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionSettings;
