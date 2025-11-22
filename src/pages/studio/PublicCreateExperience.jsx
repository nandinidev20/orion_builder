import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const PublicCreateExperience = () => {
  const [formData, setFormData] = useState({
    title: '',
    intro: '',
    startDate: '',
    endDate: '',
    timeLimit: '',
    softCapacity: '',
    brandColor: '#4f46e5',
    coverImage: null,
    logo: null,
    backgroundColor: '#ffffff',
    fontColor: '#000000',
    buttonColor: '#4f46e5',
    accentColor: '#6366f1',
    trackVisibility: 'show-all',
    tracks: []
  });

  const [titleUniqueness, setTitleUniqueness] = useState({ checking: false, unique: null, error: null });
  const [debouncedTitle, setDebouncedTitle] = useState('');

  // Debounce effect for title uniqueness check
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTitle(formData.title);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [formData.title]);

  // Check title uniqueness when debounced title changes
  useEffect(() => {
    if (debouncedTitle.trim() !== '') {
      const checkUniqueness = async () => {
        setTitleUniqueness({ checking: true, unique: null, error: null });
        try {
          // Mock API call for title uniqueness check
          await new Promise(resolve => setTimeout(resolve, 500));
          // Mock response - assuming title is unique for demo purposes
          setTitleUniqueness({ checking: false, unique: true, error: null });
        } catch (error) {
          setTitleUniqueness({ checking: false, unique: null, error: 'Failed to check title uniqueness' });
        }
      };
      checkUniqueness();
    } else {
      setTitleUniqueness({ checking: false, unique: null, error: null });
    }
  }, [debouncedTitle]);

  const [currentTrack, setCurrentTrack] = useState({
    id: Date.now(),
    title: '',
    trackType: 'audio',
    audioFile: null,
    videoFile: null,
    textContent: '',
    imageFile: null,
    progressRule: 'tap',
    unlockCode: ''
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [createdExperienceId, setCreatedExperienceId] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [draggedTrack, setDraggedTrack] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files[0]
    }));
  };

  const handleTrackChange = (field, value) => {
    setCurrentTrack(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTrackFileChange = (fieldName, file) => {
    setCurrentTrack(prev => ({
      ...prev,
      [fieldName]: file
    }));
  };

  const addTrack = () => {
    if (!currentTrack.title) {
      alert('Please enter a track title');
      return;
    }

    // Validate based on track type
    if (currentTrack.trackType === 'audio' && !currentTrack.audioFile) {
      alert('Please select an audio file for the track');
      return;
    } else if (currentTrack.trackType === 'video' && !currentTrack.videoFile) {
      alert('Please select a video file for the track');
      return;
    } else if (currentTrack.trackType === 'text' && !currentTrack.textContent.trim()) {
      alert('Please enter text content for the track');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      tracks: [...prev.tracks, { ...currentTrack, id: `track-${Date.now()}-${Math.random()}` }]
    }));
    
    setCurrentTrack({
      id: `track-${Date.now()}-${Math.random() + 1}`,
      title: '',
      trackType: 'audio',
      audioFile: null,
      videoFile: null,
      textContent: '',
      imageFile: null,
      progressRule: 'tap',
      unlockCode: ''
    });
  };

  const removeTrack = (id) => {
    setFormData(prev => ({
      ...prev,
      tracks: prev.tracks.filter(track => track.id !== id)
    }));
  };

  const handleDragStart = (e, index) => {
    setDraggedTrack(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedTrack === null || draggedTrack === index) return;

    const tracks = [...formData.tracks];
    const draggedItem = tracks[draggedTrack];
    tracks.splice(draggedTrack, 1);
    tracks.splice(index, 0, draggedItem);

    setFormData(prev => ({
      ...prev,
      tracks
    }));
    setDraggedTrack(index);
  };

  const handleDragEnd = () => {
    setDraggedTrack(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setApiError('');
    setErrors({});
    
    try {
      // Validate that we have at least one track
      if (formData.tracks.length === 0) {
        setApiError('Please add at least one track before creating the experience.');
        setLoading(false);
        return;
      }

      // Mock API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock success response
      const mockExperienceId = 'mock-experience-' + Date.now();
      console.log('Mock experience created with ID:', mockExperienceId);
      setCreatedExperienceId(mockExperienceId);
      setShowSuccess(true);
    } catch (error) {
      console.error('Error creating experience:', error);
      const errorMessage = 'Failed to create experience. Please try again.';
      setApiError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      intro: '',
      startDate: '',
      endDate: '',
      timeLimit: '',
      softCapacity: '',
      brandColor: '#4f46e5',
      coverImage: null,
      logo: null,
      backgroundColor: '#ffffff',
      fontColor: '#000000',
      buttonColor: '#4f46e5',
      accentColor: '#6366f1',
      tracks: []
    });
    setCurrentTrack({
      id: `track-${Date.now()}`,
      title: '',
      trackType: 'audio',
      audioFile: null,
      videoFile: null,
      textContent: '',
      imageFile: null,
      progressRule: 'tap',
      unlockCode: ''
    });
    setShowSuccess(false);
    setCreatedExperienceId(null);
    setApiError('');
    setErrors({});
  };

  const guestUrl = createdExperienceId ? `${window.location.origin}/experience/${createdExperienceId}` : '';

  if (showSuccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Experience Created Successfully!</h1>
          <p className="text-gray-600 mt-1">Your experience has been created with all tracks and is ready to share.</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Guest Access QR Code</h2>
          <div className="flex flex-col items-center">
            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <QRCodeCanvas 
                value={guestUrl} 
                size={256}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-sm text-gray-600 mb-4 text-center">
              Scan this QR code to access the experience as a guest.<br />
              URL: <a href={guestUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{guestUrl}</a>
            </p>
            <div className="flex space-x-4">
              <button 
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                onClick={() => {
                  alert('QR code downloaded!');
                }}
              >
                Download QR Code
              </button>
              <button 
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                onClick={resetForm}
              >
                Create Another Experience
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="bg-indigo-100 text-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">📊</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">View Analytics</h3>
              <p className="text-sm text-gray-600">Monitor your experience performance</p>
              <button className="mt-3 text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                Go to Analytics
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="bg-indigo-100 text-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">✏️</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Edit Experience</h3>
              <p className="text-sm text-gray-600">Make changes to your experience</p>
              <button className="mt-3 text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                Edit Experience
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="bg-indigo-100 text-indigo-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">📋</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Manage Tracks</h3>
              <p className="text-sm text-gray-600">Add or remove tracks</p>
              <button className="mt-3 text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                Manage Tracks
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Experience</h1>
        <p className="text-gray-600 mt-1">Create an immersive experience with multiple tracks</p>
      </div>

      {apiError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 00 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{apiError}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="relative">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Experience Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter experience title"
              required
            />
            {/* Title uniqueness indicator */}
            {formData.title.trim() !== '' && titleUniqueness.checking && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
            {formData.title.trim() !== '' && !titleUniqueness.checking && titleUniqueness.unique !== null && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {titleUniqueness.unique ? (
                  <span className="text-green-500" title="Title is unique">✓</span>
                ) : (
                  <span className="text-red-500" title="Title already exists">✗</span>
                )}
              </div>
            )}
            {titleUniqueness.error && (
              <div className="mt-1 text-sm text-red-600">{titleUniqueness.error}</div>
            )}
          </div>

          <div>
            <label htmlFor="intro" className="block text-sm font-medium text-gray-700 mb-1">
              Intro: Small Introduction
            </label>
            <textarea
              id="intro"
              name="intro"
              value={formData.intro}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter a brief introduction for your experience"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-1">
              Cover Image for the Experience
            </label>
            <div className="mt-1 flex items-center">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center mr-4">
                <span className="text-lg">🖼️</span>
              </div>
              <div>
                <input
                  type="file"
                  name="coverImage"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100"
                />
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                {formData.coverImage && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    ✓ {formData.coverImage.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-50"
              required
            />
          </div>

          <div>
            <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700 mb-1">
              Time Limit (minutes) - Optional
            </label>
            <input
              type="number"
              id="timeLimit"
              name="timeLimit"
              value={formData.timeLimit}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-50"
              placeholder="Leave blank for no limit"
            />
          </div>

          <div>
            <label htmlFor="softCapacity" className="block text-sm font-medium text-gray-700 mb-1">
              Soft Capacity - Optional
            </label>
            <input
              type="number"
              id="softCapacity"
              name="softCapacity"
              value={formData.softCapacity}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-30 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-50"
              placeholder="e.g., 100 users"
            />
          </div>
        </div>

        <div className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Branding</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="brandColor" className="block text-sm font-medium text-gray-700 mb-1">
                Brand Color
              </label>
              <div className="flex items-center">
                <input
                  type="color"
                  id="brandColor"
                  name="brandColor"
                  value={formData.brandColor}
                  onChange={handleInputChange}
                  className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.brandColor}
                  onChange={handleInputChange}
                  className="ml-3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-32"
                  name="brandColor"
                />
              </div>
              <div className="mt-2 p-4 rounded-lg" style={{ backgroundColor: formData.brandColor, color: formData.brandColor }}>
                Preview
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo
              </label>
              <div className="mt-1 flex items-center">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center mr-4">
                  <span className="text-lg">🖼️</span>
                </div>
                <div>
                  <input
                    type="file"
                    name="logo"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-medium
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="backgroundColor" className="block text-sm font-medium text-gray-700 mb-1">
                Background Color
              </label>
              <div className="flex items-center">
                <input
                  type="color"
                  id="backgroundColor"
                  name="backgroundColor"
                  value={formData.backgroundColor}
                  onChange={handleInputChange}
                  className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.backgroundColor}
                  onChange={handleInputChange}
                  className="ml-3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-32"
                  name="backgroundColor"
                />
              </div>
            </div>

            <div>
              <label htmlFor="fontColor" className="block text-sm font-medium text-gray-700 mb-1">
                Font Color
              </label>
              <div className="flex items-center">
                <input
                  type="color"
                  id="fontColor"
                  name="fontColor"
                  value={formData.fontColor}
                  onChange={handleInputChange}
                  className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.fontColor}
                  onChange={handleInputChange}
                  className="ml-3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-32"
                  name="fontColor"
                />
              </div>
            </div>

            <div>
              <label htmlFor="buttonColor" className="block text-sm font-medium text-gray-700 mb-1">
                Button Color
              </label>
              <div className="flex items-center">
                <input
                  type="color"
                  id="buttonColor"
                  name="buttonColor"
                  value={formData.buttonColor}
                  onChange={handleInputChange}
                  className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.buttonColor}
                  onChange={handleInputChange}
                  className="ml-3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-32"
                  name="buttonColor"
                />
              </div>
            </div>

            <div>
              <label htmlFor="accentColor" className="block text-sm font-medium text-gray-700 mb-1">
                Accent Color
              </label>
              <div className="flex items-center">
                <input
                  type="color"
                  id="accentColor"
                  name="accentColor"
                  value={formData.accentColor}
                  onChange={handleInputChange}
                  className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.accentColor}
                  onChange={handleInputChange}
                  className="ml-3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-32"
                  name="accentColor"
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-md font-semibold text-gray-900 mb-3">Track Visibility</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="show-all"
                  name="trackVisibility"
                  value="show-all"
                  checked={formData.trackVisibility === 'show-all'}
                  onChange={(e) => handleInputChange({ target: { name: 'trackVisibility', value: e.target.value } })}
                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <label htmlFor="show-all" className="ml-3 block text-sm font-medium text-gray-700">
                  Show track list - Users can see all tracks in the experience
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="show-current-only"
                  name="trackVisibility"
                  value="show-current-only"
                  checked={formData.trackVisibility === 'show-current-only'}
                  onChange={(e) => handleInputChange({ target: { name: 'trackVisibility', value: e.target.value } })}
                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <label htmlFor="show-current-only" className="ml-3 block text-sm font-medium text-gray-700">
                  Show current track only - Users can only see the current track (good for audio experiences)
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Tracks</h2>
            <button
              type="button"
              onClick={addTrack}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Track
            </button>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="trackTitle" className="block text-sm font-medium text-gray-700 mb-1">
                  Track Title
                </label>
                <input
                  type="text"
                  id="trackTitle"
                  value={currentTrack.title}
                  onChange={(e) => handleTrackChange('title', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter track title"
                />
              </div>

              <div>
                <label htmlFor="trackType" className="block text-sm font-medium text-gray-700 mb-1">
                  Track Type
                </label>
                <select
                  id="trackType"
                  value={currentTrack.trackType}
                  onChange={(e) => handleTrackChange('trackType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="audio">Audio Track</option>
                  <option value="video">Video Track</option>
                  <option value="text">Text Track</option>
                </select>
              </div>

              <div>
                <label htmlFor="progressRule" className="block text-sm font-medium text-gray-700 mb-1">
                  Progress Rule
                </label>
                <select
                  id="progressRule"
                  value={currentTrack.progressRule}
                  onChange={(e) => handleTrackChange('progressRule', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="tap">Require user tap to continue</option>
                  <option value="code">Require code input to unlock next track</option>
                </select>
              </div>

              {currentTrack.progressRule === 'code' && (
                <div className="md:col-span-2">
                  <label htmlFor="unlockCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Unlock Code
                  </label>
                  <input
                    type="text"
                    id="unlockCode"
                    value={currentTrack.unlockCode}
                    onChange={(e) => handleTrackChange('unlockCode', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter unlock code"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {currentTrack.trackType === 'audio' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Audio File (Required)
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => handleTrackFileChange('audioFile', e.target.files[0])}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {currentTrack.audioFile && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      ✓ {currentTrack.audioFile.name}
                    </p>
                  )}
                </div>
              )}
              
              {currentTrack.trackType === 'video' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Video File (Required)
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleTrackFileChange('videoFile', e.target.files[0])}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {currentTrack.videoFile && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      ✓ {currentTrack.videoFile.name}
                    </p>
                  )}
                </div>
              )}
              
              {currentTrack.trackType === 'text' && (
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Text Content (Required)
                  </label>
                  <textarea
                    value={currentTrack.textContent}
                    onChange={(e) => handleTrackChange('textContent', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter the text content for this track"
                  />
                </div>
              )}
              
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image File (Optional - acts as thumbnail)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleTrackFileChange('imageFile', e.target.files[0])}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {currentTrack.imageFile && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    ✓ {currentTrack.imageFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {formData.tracks.length > 0 && (
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Added Tracks ({formData.tracks.length})</h3>
              <div className="space-y-3">
                {formData.tracks.map((track, index) => (
                  <div
                    key={track.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`group relative flex justify-between items-center bg-white p-4 rounded-xl border-2 transition-all duration-200 ${
                      draggedTrack === index 
                        ? 'opacity-40 scale-95 border-indigo-400 shadow-lg rotate-2' 
                        : 'border-gray-200 hover:border-indigo-300 hover:shadow-md cursor-grab active:cursor-grabbing'
                    }`}
                  >
                    <div className="flex items-center flex-1 pointer-events-none">
                      <div className={`mr-4 transition-colors duration-200 ${
                        draggedTrack === index ? 'text-indigo-500' : 'text-gray-400 group-hover:text-indigo-500'
                      }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 3C9 2.44772 8.55228 2 8 2C7.44772 2 7 2.44772 7 3V21C7 21.5523 7.44772 22 8 22C8.55228 22 9 21.5523 9 21V3Z"/>
                          <path d="M15 3C15 2.44772 15.4477 2 16 2C16.5523 2 17 2.44772 17 3V21C17 21.5523 16.5523 22 16 22C15.4477 22 15 21.5523 15 21V3Z"/>
                        </svg>
                      </div>
                      <div className="flex items-center gap-3 flex-1">
                        <div className="bg-indigo-100 text-indigo-700 font-semibold w-8 h-8 rounded-lg flex items-center justify-center text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{track.title}</span>
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                              {track.progressRule === 'tap' ? '👆 Tap to continue' : '🔐 Code required'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full flex items-center gap-1">
                              <span>
                                {track.trackType === 'audio' && '🎵'}
                                {track.trackType === 'video' && '🎬'}
                                {track.trackType === 'text' && '📝'}
                              </span> {track.trackType.charAt(0).toUpperCase() + track.trackType.slice(1)}
                            </span>
                            {track.imageFile && (
                              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
                                <span>🖼️</span> Thumbnail
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTrack(track.id)}
                      className="ml-3 text-red-600 hover:text-white hover:bg-red-600 p-2 rounded-lg transition-all duration-200 pointer-events-auto flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={resetForm}
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
            disabled={loading}
          >
            Reset
          </button>
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium flex items-center disabled:opacity-50"
            disabled={loading || formData.tracks.length === 0 || (formData.title.trim() !== '' && !titleUniqueness.unique && !titleUniqueness.checking)}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : 'Create Experience'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PublicCreateExperience;
