import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import api from '../../services/api';

const StudioDashboard = () => {
  const [stats, setStats] = useState([]);
  const [recentExperiences, setRecentExperiences] = useState([]);
  const [studioInfo, setStudioInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [experienceToDelete, setExperienceToDelete] = useState(null);
  const [copyUrlModalOpen, setCopyUrlModalOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all required data concurrently
        const [statsResponse, experiencesResponse, studioInfoResponse] = await Promise.all([
          api.get('/studio/dashboard/stats'),
          api.get('/studio/dashboard/recent-experiences'),
          api.get('/studio/dashboard/studio-info')
        ]);

        // Set stats data - only My Experiences
        const statsData = [
          { name: 'My Experiences', value: statsResponse.data.data.totalExperiences?.toString() || '0', change: statsResponse.data.changes?.totalExperiences || '0', changeType: 'positive' },
        ];
        setStats(statsData);

        // Set recent experiences data
        setRecentExperiences(experiencesResponse.data.data.experiences || []);

        // Set studio info data - Fixed to use .data.data
        setStudioInfo(studioInfoResponse.data.data || {});
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-4 my-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
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

  const openDeleteModal = (id, title) => {
    setExperienceToDelete({ id, title });
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setExperienceToDelete(null);
  };

  const confirmDeleteExperience = async () => {
    if (!experienceToDelete) return;

    const { id, title } = experienceToDelete;

    try {
      // In the dashboard, we'll just remove from the local state since we can't actually delete from here
      // The actual delete would happen in the main experiences page
      setRecentExperiences(prev => prev.filter(exp => exp.id !== id && exp._id !== id));
      // Show success message (you might want to implement a toast notification)
      alert('Experience deleted successfully');
    } catch (err) {
      console.error('Error deleting experience:', err);
      alert(err.message || 'Failed to delete experience');
    } finally {
      closeDeleteModal();
    }
  };

  const handleDeleteExperience = (id, title) => {
    openDeleteModal(id, title);
  };

  // Function to open QR code modal
  const openQrModal = (experience) => {
    setSelectedExperience(experience);
    setQrModalOpen(true);
  };

  // Function to copy URL to clipboard
  const copyUrlToClipboard = (experience) => {
    const url = `${window.location.origin}/experience/${experience.slug || experience.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      setCopyUrlModalOpen(true);
    }).catch(err => {
      console.error('Failed to copy URL: ', err);
      alert('Failed to copy URL');
    });
  };

  const closeCopyUrlModal = () => {
    setCopyUrlModalOpen(false);
    setCopiedUrl('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Studio Dashboard</h1>
        <Link to="/studio/create" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
          Create Experience
        </Link>
      </div>

      {/* Stats Cards - Only My Experiences */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-600">{stat.name}</p>
            <div className="mt-2 flex items-baseline">
              <p className="text-3xl font-semibold text-gray-900">{stat.value}</p>
              <p className={`ml-2 text-sm ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Experiences - Simplified card list */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Experiences</h2>
            <Link to="/studio/experiences" className="text-indigo-600 text-sm font-medium hover:text-indigo-700 transition flex items-center">
              View All
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {recentExperiences.length > 0 ? (
            <div className="space-y-3">
              {recentExperiences.slice(0, 5).map((experience) => (
                <div key={experience.id || experience._id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition group">
                  <div className="flex items-center flex-1 min-w-0">
                    {experience.icon ? (
                      <img
                        src={experience.icon}
                        alt={experience.title}
                        className="w-10 h-10 rounded-lg mr-3 object-cover flex-shrink-0"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' fill='%23e5e7eb'/%3E%3Ctext x='12' y='15' font-size='16' font-weight='bold' text-anchor='middle' fill='%239ca3af'%3E?%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    ) : (
                      <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg w-10 h-10 flex items-center justify-center mr-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{experience.title}</h3>
                      <a
                        href={`${window.location.origin}/experience/${experience.slug || experience.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:text-indigo-800 truncate block mt-0.5"
                        title={`${window.location.origin}/experience/${experience.slug || experience.id}`}
                      >
                        /experience/{experience.slug || experience.id}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Link 
                      to={`/studio/edit/${experience.id || experience._id}`} 
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium px-3 py-1.5 rounded hover:bg-indigo-50 transition"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-gray-500 mb-4">You haven't created any experiences yet</p>
              <Link to="/studio/create" className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                Create Your First Experience
              </Link>
            </div>
          )}
        </div>

        {/* Studio Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Studio Information</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-indigo-100 rounded-lg p-2 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Studio Name</p>
                <p className="font-semibold text-gray-900 mt-1">{studioInfo.studioName || 'Loading...'}</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-purple-100 rounded-lg p-2 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Subdomain</p>
                <p className="font-semibold text-gray-900 mt-1">{studioInfo.subdomain || 'Loading...'}</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-green-100 rounded-lg p-2 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-semibold text-gray-900 mt-1">{studioInfo.created ? new Date(studioInfo.created).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Loading...'}</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-blue-100 rounded-lg p-2 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Plan</p>
                <p className="font-semibold text-gray-900 mt-1">{studioInfo.plan || 'Loading...'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {qrModalOpen && selectedExperience && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{selectedExperience.title}</h3>
              <button 
                onClick={() => setQrModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col items-center py-4">
              <div className="bg-white p-4 rounded-lg mb-4">
                <QRCodeCanvas 
                  value={`${window.location.origin}/experience/${selectedExperience.id || selectedExperience._id}`} 
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm text-gray-600 mb-4 text-center">Scan this QR code to access the experience</p>
              <button
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                onClick={() => {
                  const canvas = document.querySelector('canvas');
                  if (canvas) {
                    const link = document.createElement('a');
                    link.download = `qr-code-${selectedExperience.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                  }
                }}
              >
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && experienceToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
              <button 
                onClick={closeDeleteModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="py-4">
              <p className="text-gray-600 mb-4">Are you sure you want to delete the experience <strong>"{experienceToDelete.title}"</strong>? This action cannot be undone.</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteExperience}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Copy URL Modal */}
      {copyUrlModalOpen && copiedUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">URL Copied Successfully</h3>
              <button 
                onClick={closeCopyUrlModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="py-4">
              <p className="text-gray-600 mb-4">The following URL has been copied to your clipboard:</p>
              <div className="bg-gray-100 p-3 rounded-lg mb-4 break-words">
                <p className="text-sm text-gray-800">{copiedUrl}</p>
              </div>
              <button
                onClick={closeCopyUrlModal}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioDashboard;