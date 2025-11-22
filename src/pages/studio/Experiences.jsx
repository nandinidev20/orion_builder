import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { newExperienceAPI } from '../../services/api';
import { calculateExperienceStatus, getStatusColorClass, getStatusLabel } from '../../utils/statusCalculator';

const StudioExperiences = () => {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [experienceToDelete, setExperienceToDelete] = useState(null);
  const [copyUrlModalOpen, setCopyUrlModalOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        setLoading(true);
        const response = await newExperienceAPI.getNewExperiences({ page: currentPage, limit: 10 });
        const data = response.data || response;
        setExperiences(data.experiences || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching experiences:', err);
        setError(err.message || 'Failed to load experiences');
      } finally {
        setLoading(false);
      }
    };

    fetchExperiences();
  }, [currentPage]);

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
      await newExperienceAPI.deleteNewExperience(id);
      // Remove the deleted experience from the local state
      setExperiences(prev => prev.filter(exp => exp.id !== id && exp._id !== id));
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

  // Calculate status for each experience
  const getExperienceStatus = (exp) => {
    return calculateExperienceStatus(exp.startDate, exp.endDate);
  };

  const filteredExperiences = experiences.filter(exp => {
    const expStatus = getExperienceStatus(exp);
    const matchesFilter = filter === 'all' || expStatus === filter;
    const matchesSearch = exp.title?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalExperiences = experiences.length;
  const activeCount = experiences.filter(e => getExperienceStatus(e) === 'active').length;
  const totalViews = experiences.reduce((sum, exp) => sum + (exp.analytics?.totalViews || exp.analytics?.views || 0), 0);

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

  // Function to open QR code modal
 const openQrModal = (experience) => {
    setSelectedExperience(experience);
    setQrModalOpen(true);
  };

  // Function to copy URL to clipboard
  const copyUrlToClipboard = (experience) => {
    const url = `${window.location.origin}/experience/${experience.slug}`;
    
    // Check if the Clipboard API is available
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedUrl(url);
        setCopyUrlModalOpen(true);
      }).catch(err => {
        console.error('Failed to copy URL: ', err);
        // Fallback to execCommand if Clipboard API fails
        fallbackCopyTextToClipboard(url);
      });
    } else {
      // Fallback to execCommand for older browsers or insecure contexts
      fallbackCopyTextToClipboard(url);
    }
  };

  // Fallback function to copy text to clipboard using execCommand
  const fallbackCopyTextToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-99999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopiedUrl(text);
        setCopyUrlModalOpen(true);
      } else {
        console.error('Failed to copy URL using fallback method');
        alert('Failed to copy URL. Please try again.');
      }
    } catch (err) {
      console.error('Failed to copy URL: ', err);
      alert('Failed to copy URL. Please try again.');
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const closeCopyUrlModal = () => {
    setCopyUrlModalOpen(false);
    setCopiedUrl('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Experiences</h1>
          <p className="text-gray-600 mt-1">Manage your immersive experiences</p>
        </div>
        <Link to="/studio/create" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
          Create New Experience
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Total Experiences</p>
          <p className="text-3xl font-semibold text-gray-90">{totalExperiences}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Active Now</p>
          <p className="text-3xl font-semibold text-gray-90">
            {activeCount}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-600">Total Views</p>
          <p className="text-3xl font-semibold text-gray-900">
            {totalViews.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'} hover:bg-gray-200 transition`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg ${filter === 'active' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'} hover:bg-gray-200 transition`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('scheduled')}
              className={`px-4 py-2 rounded-lg ${filter === 'scheduled' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'} hover:bg-gray-200 transition`}
            >
              Scheduled
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-4 py-2 rounded-lg ${filter === 'expired' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'} hover:bg-gray-200 transition`}
            >
              Expired
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search experiences..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Experiences Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Public Link</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExperiences.length > 0 ? (
                filteredExperiences.map((experience) => (
                  <tr key={experience.id || experience._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {experience.icon ? (
                          <img
                            src={experience.icon}
                            alt={experience.title}
                            className="w-12 h-12 rounded-lg mr-3 object-cover shadow-sm"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' fill='%23e5e7eb'/%3E%3Ctext x='12' y='15' font-size='18' font-weight='bold' text-anchor='middle' fill='%239ca3af'%3E?%3C/text%3E%3C/svg%3E";
                            }}
                          />
                        ) : (
                          <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg w-12 h-12 flex items-center justify-center mr-3 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900">{experience.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{experience.subtitle || 'No subtitle'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 group">
                        <div className="flex-1">
                          <a
                            href={`${window.location.origin}/experience/${experience.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-900 text-sm truncate block"
                            title={`${window.location.origin}/experience/${experience.slug}`}
                          >
                            {window.location.origin}/experience/{experience.slug}
                          </a>
                        </div>
                        <button
                          onClick={() => copyUrlToClipboard(experience)}
                          className="text-gray-400 hover:text-indigo-600 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Copy URL"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {experience.startDate ? (
                        <div>
                          <div className="text-gray-900 font-medium">{new Date(experience.startDate).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">{new Date(experience.startDate).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {experience.endDate ? (
                        <div>
                          <div className="text-gray-900 font-medium">{new Date(experience.endDate).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">{new Date(experience.endDate).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        getStatusColorClass(getExperienceStatus(experience))
                      }`}>
                        {getStatusLabel(getExperienceStatus(experience))}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <Link to={`/studio/edit/${experience.id || experience._id}`} className="text-indigo-600 hover:text-indigo-900 font-medium">Edit</Link>
                        <button
                          onClick={() => openQrModal(experience)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                          title="Generate QR Code"
                        >
                          QR
                        </button>
                        <button
                          onClick={() => handleDeleteExperience(experience.id || experience._id, experience.title)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m0 0h6m-6-6h6m0 0h6" />
                      </svg>
                      <p>No experiences found</p>
                      <p className="text-xs text-gray-400 mt-1">Create a new experience to get started</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing page <span className="font-semibold">{pagination.page}</span> of <span className="font-semibold">{pagination.pages}</span> (Total: <span className="font-semibold">{pagination.total}</span> experiences)
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                ← Previous
              </button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg font-medium transition ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                disabled={currentPage === pagination.pages}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  currentPage === pagination.pages
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next →
              </button>
            </div>
          </div>
        )}
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
                  value={`${window.location.origin}/experience/${selectedExperience.slug}`}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm text-gray-600 mb-4 text-center">Scan this QR code to access the experience</p>
              <button
                className="bg-indigo-60 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
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
                className="text-gray-400 hover:text-gray-50"
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
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-70 transition"
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

export default StudioExperiences;
