import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';

const PublicExperiences = () => {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [experienceToDelete, setExperienceToDelete] = useState(null);
  const [copyUrlModalOpen, setCopyUrlModalOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState('');

  // Mock data initialization
  useEffect(() => {
    // Simulate API call delay
    setTimeout(() => {
      const mockExperiences = [
        {
          id: 1,
          title: 'Product Demo Experience',
          status: 'Published',
          createdAt: '2023-06-15',
          startDate: '2023-06-20',
          endDate: '2023-07-20',
          stagesCount: 5,
          analytics: {
            totalViews: 245,
            completions: 176
          }
        },
        {
          id: 2,
          title: 'Onboarding Journey',
          status: 'Published',
          createdAt: '2023-06-18',
          startDate: '2023-06-22',
          endDate: '2023-08-22',
          stagesCount: 8,
          analytics: {
            totalViews: 198,
            completions: 135
          }
        },
        {
          id: 3,
          title: 'Feature Walkthrough',
          status: 'Draft',
          createdAt: '2023-06-20',
          startDate: '2023-07-01',
          endDate: '2023-08-01',
          stagesCount: 6,
          analytics: {
            totalViews: 0,
            completions: 0
          }
        },
        {
          id: 4,
          title: 'Tutorial Series',
          status: 'Published',
          createdAt: '2023-06-22',
          startDate: '2023-06-25',
          endDate: '2023-07-25',
          stagesCount: 10,
          analytics: {
            totalViews: 134,
            completions: 89
          }
        },
        {
          id: 5,
          title: 'Customer Stories',
          status: 'Published',
          createdAt: '2023-06-25',
          startDate: '2023-06-30',
          endDate: '2023-08-30',
          stagesCount: 4,
          analytics: {
            totalViews: 98,
            completions: 72
          }
        },
        {
          id: 6,
          title: 'Interactive Guide',
          status: 'Draft',
          createdAt: '2023-06-28',
          startDate: '2023-07-10',
          endDate: '2023-08-10',
          stagesCount: 7,
          analytics: {
            totalViews: 0,
            completions: 0
          }
        }
      ];

      setExperiences(mockExperiences);
      setError(null);
      setLoading(false);
    }, 500);
  }, []);

  const openDeleteModal = (id, title) => {
    setExperienceToDelete({ id, title });
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setExperienceToDelete(null);
  };

  const confirmDeleteExperience = () => {
    if (!experienceToDelete) return;

    // Mock deletion - remove from local state
    setExperiences(prev => prev.filter(exp => exp.id !== experienceToDelete.id));
    // Show success message
    alert('Experience deleted successfully (mock)');
    closeDeleteModal();
  };

  const handleDeleteExperience = (id, title) => {
    openDeleteModal(id, title);
  };

  const filteredExperiences = experiences.filter(exp => {
    const matchesSearch = exp.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalExperiences = experiences.length;
  const publishedCount = experiences.filter(e => e.status === 'Published' || e.status === 'published').length;
  const totalViews = experiences.reduce((sum, exp) => sum + (exp.analytics?.totalViews || 0), 0);

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
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 00 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-70">
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
    // Use modern clipboard API if available, otherwise fallback to execCommand
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedUrl(url);
        setCopyUrlModalOpen(true);
      }).catch(err => {
        console.error('Failed to copy URL: ', err);
        // Fallback to execCommand if clipboard API fails
        fallbackCopyTextToClipboard(url);
      });
    } else {
      fallbackCopyTextToClipboard(url);
    }
  };

  // Fallback function for copying text to clipboard
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
        alert('Failed to copy URL');
      }
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
      alert('Failed to copy URL');
    }
    document.body.removeChild(textArea);
  };

  const closeCopyUrlModal = () => {
    setCopyUrlModalOpen(false);
    setCopiedUrl('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Public Experiences</h1>
          <p className="text-gray-600 mt-1">Manage public immersive experiences</p>
        </div>
        <Link to="/public/studio/create" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
          Create New Experience
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-3">
          <p className="text-sm font-medium text-gray-600">Total Experiences</p>
          <p className="text-3xl font-semibold text-gray-90">{totalExperiences}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search experiences..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Window</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stages Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExperiences.length > 0 ? (
                  filteredExperiences.map((experience) => (
                    <tr key={experience.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 flex items-center justify-center mr-3">
                            <span className="text-lg">🎧</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{experience.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {experience.startDate} - {experience.endDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{experience.stagesCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          experience.status === 'Published' || experience.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {experience.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(experience.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link to={`/public/studio/experiences/${experience.id}`} className="text-indigo-60 hover:text-indigo-900">Preview</Link>
                          <Link to={`/public/studio/edit/${experience.id}`} className="text-indigo-60 hover:text-indigo-900">Edit</Link>
                          <button 
                            onClick={() => openQrModal(experience)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            QR Code
                          </button>
                          <button 
                            onClick={() => copyUrlToClipboard(experience)}
                            className="text-indigo-60 hover:text-indigo-900 flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy URL
                          </button>
                          <button 
                            onClick={() => handleDeleteExperience(experience.id, experience.title)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      No experiences found
                    </td>
                  </tr>
                )}
              </tbody>
          </table>
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
                className="text-gray-400 hover:text-gray-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col items-center py-4">
              <div className="bg-white p-4 rounded-lg mb-4">
                <QRCodeCanvas 
                  value={`${window.location.origin}/experience/${selectedExperience.id}`} 
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

export default PublicExperiences;
