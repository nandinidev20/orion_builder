import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { experienceAPI } from '../../services/api';

const StudioExperienceDetails = () => {
  const { id } = useParams();
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrSize, setQrSize] = useState(256);
  const [editingTrack, setEditingTrack] = useState(null);
  const [editTrackForm, setEditTrackForm] = useState({ title: '' });

  useEffect(() => {
    const fetchExperience = async () => {
      try {
        setLoading(true);
        const response = await experienceAPI.getExperienceById(id);
        console.log(response.data);
        setExperience(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching experience:', err);
        setError(err.message || 'Failed to load experience');
      } finally {
        setLoading(false);
      }
    };

    fetchExperience();
  }, [id]);

  // Generate the URL for the guest experience
  const guestUrl = experience ? `${window.location.origin}/experience/${experience.slug}` : '';

  // Handle track edit
  const handleEditTrack = (track) => {
    setEditingTrack(track);
    setEditTrackForm({ title: track.title });
  };

  // Handle track update
  const handleUpdateTrack = async () => {
    try {
      // In a real implementation, you would call an API to update the track
      // For now, we'll just update the local state
      const updatedTracks = experience.tracks.map(track => 
        track.id === editingTrack.id ? { ...track, title: editTrackForm.title } : track
      );
      
      setExperience({ ...experience, tracks: updatedTracks });
      setEditingTrack(null);
      setEditTrackForm({ title: '' });
    } catch (err) {
      console.error('Error updating track:', err);
      alert('Failed to update track');
    }
  };

  // Handle track delete
  const handleDeleteTrack = async (trackId) => {
    if (!window.confirm('Are you sure you want to delete this track?')) {
      return;
    }

    try {
      // In a real implementation, you would call an API to delete the track
      // For now, we'll just update the local state
      const updatedTracks = experience.tracks.filter(track => track.id !== trackId);
      setExperience({ ...experience, tracks: updatedTracks });
    } catch (err) {
      console.error('Error deleting track:', err);
      alert('Failed to delete track');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 00 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              <span className="font-medium">Error!</span> {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <span className="font-medium">Warning!</span> Experience not found
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Use analytics data from the experience or provide defaults
  const analytics = experience.analytics || {
    totalViews: 0,
    uniqueVisitors: 0,
    completionRate: 0,
    avgSessionTime: '0m 0s',
    topLocations: [],
    deviceBreakdown: [],
    dailyViews: []
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{experience.title}</h1>
          <p className="text-gray-600 mt-1">Manage and analyze your experience</p>
        </div>
        <div className="flex space-x-3">
          <Link 
            to={`/studio/edit/${id}`}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Edit Experience
          </Link>
          <button 
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            onClick={() => setShowQRCode(!showQRCode)}
          >
            {showQRCode ? 'Hide QR Code' : 'Show QR Code'}
          </button>
        </div>
      </div>

      {/* QR Code Section */}
      {showQRCode && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Guest Access QR Code</h2>
          <div className="flex flex-col items-center">
            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <QRCodeCanvas 
                value={guestUrl} 
                size={qrSize}
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
            <div className="flex items-center space-x-4">
              <button 
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                onClick={() => {
                  const canvas = document.querySelector('canvas');
                  if (canvas) {
                    const url = canvas.toDataURL('image/png');
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `experience-${experience.id}-qrcode.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }
                }}
              >
                Download QR Code
              </button>
              <div className="flex items-center">
                <label htmlFor="qrSize" className="text-sm text-gray-700 mr-2">Size:</label>
                <select 
                  id="qrSize"
                  value={qrSize}
                  onChange={(e) => setQrSize(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={128}>Small</option>
                  <option value={256}>Medium</option>
                  <option value={512}>Large</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Experience Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Status</p>
          <p className="text-2xl font-semibold text-gray-900">
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
              active
            </span>
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Total Views</p>
          <p className="text-2xl font-semibold text-gray-900">{analytics.totalViews.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Completion Rate</p>
          <p className="text-2xl font-semibold text-gray-900">{analytics.completionRate}%</p>
        </div>
      </div>

      {/* Experience Details */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Experience Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Description</p>
            <p className="font-medium">{experience.description}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Duration Limit</p>
            <p className="font-medium">{experience.timeLimit} minutes</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Active Period</p>
            <p className="font-medium">{experience.startDate} to {experience.endDate}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Capacity</p>
            <p className="font-medium">{experience.softCapacity} users</p>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-30">
            <p className="text-gray-500">Performance chart would appear here</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Views</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-30">
            <p className="text-gray-50">Daily views chart would appear here</p>
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Experience Tracks</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Track</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plays</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {experience?.tracks?.map((track) => (
                <tr key={track.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{track.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{track.duration}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{track?.plays?.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={() => handleEditTrack(track)}
                      >
                        Edit
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteTrack(track.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Locations</h2>
          <div className="space-y-4">
            {analytics?.topLocations?.map((location, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{location.location}</span>
                  <span className="text-sm font-medium text-gray-700">{location.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-60 h-2 rounded-full" 
                    style={{ width: `${location.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h2>
          <div className="space-y-4">
            {analytics?.deviceBreakdown?.map((device, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{device.device}</span>
                  <span className="text-sm font-medium text-gray-700">{device.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-60 h-2 rounded-full" 
                    style={{ width: `${device.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Track Modal */}
      {editingTrack && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Track</h3>
              <button 
                onClick={() => setEditingTrack(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div className="mb-4">
              <label htmlFor="trackTitle" className="block text-sm font-medium text-gray-700 mb-1">
                Track Title
              </label>
              <input
                type="text"
                id="trackTitle"
                value={editTrackForm.title}
                onChange={(e) => setEditTrackForm({ ...editTrackForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter track title"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setEditingTrack(null)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateTrack}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioExperienceDetails;
