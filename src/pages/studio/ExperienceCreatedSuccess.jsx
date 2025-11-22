import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { CheckCircle, Copy, ExternalLink, ArrowLeft, Share2, Download, Sparkles } from 'lucide-react';
import { newExperienceAPI } from '../../services/api';

const ExperienceCreatedSuccess = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [downloadingQR, setDownloadingQR] = useState(false);

  useEffect(() => {
    const fetchExperience = async () => {
      try {
        setLoading(true);
        const response = await newExperienceAPI.getNewExperienceById(id);
        setExperience(response.data || response);
        setError(null);
      } catch (err) {
        console.error('Error fetching experience:', err);
        setError('Failed to load experience details');
        setExperience(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchExperience();
    }
  }, [id]);

  const slug = experience?.slug || '';
  const experienceLink = `${window.location.origin}/experience/${slug}`;

  const handleCopyLink = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(experienceLink).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        fallbackCopyToClipboard();
      });
    } else {
      fallbackCopyToClipboard();
    }
  };

  const fallbackCopyToClipboard = () => {
    const textarea = document.createElement('textarea');
    textarea.value = experienceLink;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-99999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy URL:', err);
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const handleViewExperience = () => {
    window.open(experienceLink, '_blank');
  };

  const handleDownloadQR = () => {
    setDownloadingQR(true);
    const canvas = document.getElementById('qr-code-canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${experience?.title || 'experience'}-qr-code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setTimeout(() => setDownloadingQR(false), 500);
  };

  const handleDashboard = () => {
    navigate('/studio');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-spin" style={{ opacity: 0.3 }}></div>
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            </div>
          </div>
          <p className="text-gray-600 font-medium">Loading experience details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
            <p className="text-gray-600 mb-4">{error}</p>
          </div>
          <button
            onClick={handleDashboard}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Header with Success Icon */}
          <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-16 sm:px-12 sm:py-20 text-center overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
              <div className="absolute top-0 right-0 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-3xl" style={{ animation: 'float 6s ease-in-out infinite' }}></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <div className="bg-white bg-opacity-20 backdrop-blur-md p-4 rounded-2xl">
                  <CheckCircle className="w-16 h-16 text-white" />
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 flex items-center justify-center gap-2">
                <Sparkles className="w-8 h-8 text-yellow-200" />
                Experience Created!
              </h1>
              <p className="text-indigo-100 text-lg font-medium">
                {experience?.title || 'Your experience'} is ready to share with the world
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 sm:p-12">
            {/* Experience Title */}
            {experience?.title && (
              <div className="mb-10 pb-10 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Experience Title</h2>
                <p className="text-4xl font-bold text-gray-900">{experience.title}</p>
                {experience?.subtitle && (
                  <p className="text-lg text-gray-600 mt-3">{experience.subtitle}</p>
                )}
              </div>
            )}

            {/* Link Section with Copy Button */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-indigo-600" />
                  Share Your Experience
                </h2>
              </div>
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                <p className="text-sm text-gray-600 mb-4 font-medium">Public Link:</p>
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="text"
                    readOnly
                    value={experienceLink}
                    className="flex-1 bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${
                      copied
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <button
                  onClick={handleViewExperience}
                  className="w-full bg-white hover:bg-gray-50 text-indigo-600 font-semibold py-2 px-4 rounded-lg border-2 border-indigo-200 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Preview Experience
                </button>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4z"/>
                  <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zm5-3a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
                QR Code
              </h2>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100 flex flex-col items-center">
                <div className="bg-white p-6 rounded-2xl border-4 border-gray-200 shadow-xl mb-6">
                  <div id="qr-code-container">
                    <QRCodeCanvas
                      id="qr-code-canvas"
                      value={experienceLink}
                      size={256}
                      level="H"
                      includeMargin={true}
                      fgColor="#000000"
                      bgColor="#ffffff"
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600 text-center mb-4 font-medium">Scan to access instantly</p>
                <button
                  onClick={handleDownloadQR}
                  disabled={downloadingQR}
                  className="flex items-center gap-2 bg-white hover:bg-gray-50 text-purple-600 font-semibold py-2 px-6 rounded-lg border-2 border-purple-200 transition-all duration-200 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {downloadingQR ? 'Downloading...' : 'Download QR Code'}
                </button>
              </div>
            </div>

            {/* Experience Details Grid */}
            {experience && (
              <div className="mb-10 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Experience Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {experience.startDate && (
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Start Date</p>
                      <p className="text-lg text-gray-900 font-bold">
                        {new Date(experience.startDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {experience.endDate && (
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">End Date</p>
                      <p className="text-lg text-gray-900 font-bold">
                        {new Date(experience.endDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {experience.stages && (
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Stages</p>
                      <p className="text-lg text-gray-900 font-bold">{experience.stages.length} stage{experience.stages.length !== 1 ? 's' : ''}</p>
                    </div>
                  )}
                  {experience.visibility && (
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Visibility</p>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <p className="text-lg text-gray-900 font-bold capitalize">{experience.visibility}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <button
                onClick={handleViewExperience}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <ExternalLink className="w-5 h-5" />
                View Live Experience
              </button>
              <button
                onClick={handleDashboard}
                className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-4 px-6 rounded-xl transition-all duration-200 border-2 border-gray-300"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
              </button>
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-xl">
              <div className="flex gap-4">
                <div className="text-blue-600 font-bold text-xl">💡</div>
                <div>
                  <p className="font-semibold text-blue-900 mb-1">Pro Tip:</p>
                  <p className="text-sm text-blue-800">
                    Your experience is now live! Share the link or QR code with others. They'll be able to access your experience instantly from any device.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(20px); }
        }
      `}</style>
    </div>
  );
};

export default ExperienceCreatedSuccess;
