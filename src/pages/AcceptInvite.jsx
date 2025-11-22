import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createStudioFromInvite } from '../services/inviteApi';
import { authAPI } from '../services/api';
import { CheckCircle, Building2, AlertCircle, Loader2, Shield, Check, X } from 'lucide-react';
import useStudioValidation from '../hooks/useStudioValidation';

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Validation hooks for studio name and subdomain
  const studioNameValidation = useStudioValidation('name');
  const subdomainValidation = useStudioValidation('subdomain');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteData, setInviteData] = useState({
    code: '',
    email: '',
    name: ''
  });
  const [inviteValidated, setInviteValidated] = useState(false);
  const [isInviteValid, setIsInviteValid] = useState(null);
  const [validationLoading, setValidationLoading] = useState(true);

  // Extract parameters from URL and validate invite
  useEffect(() => {
    const code = searchParams.get('code');
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    
    const inviteInfo = {
      code,
      email: decodeURIComponent(email || ''),
      name: decodeURIComponent(name || '')
    };
    
    setInviteData(inviteInfo);
    
    // Validate the invite code if we have the required parameters
    if (code) {
      validateInviteCode(inviteInfo.code, inviteInfo.email);
    } else {
      setError('No invite code found in URL. Please check your invite link.');
      setValidationLoading(false);
    }
  }, [searchParams]);

  const validateInviteCode = async (code, email) => {
    try {
      setValidationLoading(true);
      setError('');
      
      const response = await authAPI.verifyInviteCode(code, email);
      console.log(response?.data);
      if (response?.data?.isValid) {
        setIsInviteValid(true);
        // Update invite data with verified information
        setInviteData(prev => ({
          ...prev,
          email: response.data.invite.email,
          name: response.data.invite.name
        }));
      } else {
        setIsInviteValid(false);
        setError(response.message || 'Invalid or expired invite code');
      }
    } catch (err) {
      setIsInviteValid(false);
      setError(err.message || 'Failed to validate invite code. Please try again.');
    } finally {
      setValidationLoading(false);
      setInviteValidated(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'studioName') {
      studioNameValidation.setValue(value);
    } else if (name === 'subdomain') {
      subdomainValidation.setValue(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate both studio name and subdomain are available
    if (studioNameValidation.isValid !== true) {
      setError('Please ensure the studio name is valid and available');
      return;
    }

    if (subdomainValidation.isValid !== true) {
      setError('Please ensure the subdomain is valid and available');
      return;
    }

    setLoading(true);

    try {
      // Call API to create studio with email verification
      const response = await authAPI.createStudioFromInvite(
        inviteData.code,
        studioNameValidation.value,
        subdomainValidation.value,
        inviteData.email // Pass the email for verification
      );

      if (response.success) {
        // Redirect to subdomain with studio ID for password setting
        const baseDomain = import.meta.env.VITE_FRONTEND_BASE_DOMAIN || 'lvh.me:5173';
        const redirectUrl = `http://${subdomainValidation.value}.${baseDomain}/set-password?subdomain=${subdomainValidation.value}&studioName=${encodeURIComponent(studioNameValidation.value)}&studioId=${response.data.studio.id}`;
        window.location.href = redirectUrl;
      } else {
        setError('Failed to create studio. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while creating the studio. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while validating invite
  if (validationLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
            <Shield className="w-8 h-8 text-indigo-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-6 text-xl font-semibold text-gray-700">Validating your invite</p>
          <p className="mt-2 text-sm text-gray-500">Please wait while we verify your credentials...</p>
        </div>
      </div>
    );
  }

  // Show error if invite is invalid
  if (inviteValidated && !isInviteValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-100">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
            </div>
            
            <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
              Invite Invalid
            </h2>
            <p className="mt-2 text-center text-gray-600">
              The invite link you followed is invalid or has expired.
            </p>

            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error || 'This invitation link may have been used already or has expired.'}</p>
            </div>

            <button
              onClick={() => window.history.back()}
              className="mt-6 w-full py-3 px-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-medium hover:from-red-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show the main form if invite is valid
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header with validation badge */}
      <div className="pt-8 pb-4">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-full py-2 px-6 w-fit mx-auto animate-fade-in">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">Invite Validated Successfully</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-6">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Create Your Studio
          </h1>
          <p className="text-lg text-gray-600">
            Welcome <span className="font-semibold text-indigo-600">{inviteData.name || 'User'}</span>! 
            <br />Let's set up your creative workspace
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6">
            <h2 className="text-xl font-semibold text-white">Studio Configuration</h2>
            <p className="text-indigo-100 text-sm mt-1">Fill in the details below to create your studio</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Studio Name */}
              <div>
                <label htmlFor="studioName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Studio Name
                </label>
                <div className={`flex items-center px-4 py-3 border-2 rounded-xl focus-within:outline-none focus-within:ring-2 transition-all ${
                  studioNameValidation.isValid === true
                    ? 'border-green-300 focus-within:border-green-500 focus-within:ring-green-200'
                    : studioNameValidation.isValid === false
                    ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-200'
                    : 'border-gray-200 focus-within:border-indigo-500 focus-within:ring-indigo-200'
                }`}>
                  <input
                    type="text"
                    id="studioName"
                    name="studioName"
                    value={studioNameValidation.value}
                    onChange={handleChange}
                    required
                    className="flex-1 focus:outline-none bg-transparent"
                    placeholder="e.g., Creative Studios Inc."
                  />
                  {studioNameValidation.isChecking && (
                    <div className="ml-2 animate-spin">
                      <Loader2 className="w-5 h-5 text-indigo-600" />
                    </div>
                  )}
                  {studioNameValidation.isValid === true && (
                    <Check className="w-5 h-5 text-green-600 ml-2 flex-shrink-0" />
                  )}
                  {studioNameValidation.isValid === false && (
                    <X className="w-5 h-5 text-red-600 ml-2 flex-shrink-0" />
                  )}
                </div>
                {studioNameValidation.error && (
                  <p className="text-red-600 text-xs mt-2">{studioNameValidation.error}</p>
                )}
                {studioNameValidation.isValid === true && (
                  <p className="text-green-600 text-xs mt-2">✓ Studio name is available</p>
                )}
              </div>

              {/* Subdomain */}
              <div>
                <label htmlFor="subdomain" className="block text-sm font-semibold text-gray-700 mb-2">
                  Choose Your Subdomain
                </label>
                <div className={`flex rounded-xl border-2 focus-within:outline-none focus-within:ring-2 transition-all overflow-hidden ${
                  subdomainValidation.isValid === true
                    ? 'border-green-300 focus-within:border-green-500 focus-within:ring-green-200'
                    : subdomainValidation.isValid === false
                    ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-200'
                    : 'border-gray-200 focus-within:border-indigo-500 focus-within:ring-indigo-200'
                }`}>
                  <input
                    type="text"
                    id="subdomain"
                    name="subdomain"
                    value={subdomainValidation.value}
                    onChange={handleChange}
                    required
                    className="flex-1 px-4 py-3 focus:outline-none bg-transparent"
                    placeholder="your-studio"
                  />
                  {subdomainValidation.isChecking && (
                    <div className="px-3 py-3 animate-spin">
                      <Loader2 className="w-5 h-5 text-indigo-600" />
                    </div>
                  )}
                  {subdomainValidation.isValid === true && (
                    <Check className="w-5 h-5 text-green-600 px-4 py-3 flex-shrink-0" />
                  )}
                  {subdomainValidation.isValid === false && (
                    <X className="w-5 h-5 text-red-600 px-4 py-3 flex-shrink-0" />
                  )}
                  <span className={`inline-flex items-center px-4 font-medium text-sm border-l-2 ${
                    subdomainValidation.isValid === true
                      ? 'bg-green-50 text-green-600 border-green-200'
                      : subdomainValidation.isValid === false
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                    .apb.in
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  This will be your studio's unique URL
                </p>
                {subdomainValidation.error && (
                  <p className="text-red-600 text-xs mt-2">{subdomainValidation.error}</p>
                )}
                {subdomainValidation.isValid === true && (
                  <p className="text-green-600 text-xs mt-2">✓ Subdomain is available</p>
                )}
                {subdomainValidation.suggestions.length > 0 && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-semibold text-amber-800 mb-2">Try one of these alternatives:</p>
                    <div className="flex flex-wrap gap-2">
                      {subdomainValidation.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => subdomainValidation.setValue(suggestion)}
                          className="text-xs px-3 py-1 bg-white border border-amber-300 text-amber-700 rounded hover:bg-amber-50 transition-colors"
                        >
                          {suggestion}.apb.in
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-red-800">Error</h4>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  loading ||
                  studioNameValidation.isChecking ||
                  subdomainValidation.isChecking ||
                  studioNameValidation.isValid !== true ||
                  subdomainValidation.isValid !== true
                }
                className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Your Studio...
                  </>
                ) : studioNameValidation.isChecking || subdomainValidation.isChecking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Checking Availability...
                  </>
                ) : (
                  <>
                    <Building2 className="w-5 h-5" />
                    Create Studio
                  </>
                )}
              </button>
            </form>

            {/* Invite Details */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Invitation Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Sent to</p>
                  <p className="text-sm font-medium text-gray-900">{inviteData.email}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Invite Code</p>
                  <p className="text-sm font-mono font-medium text-gray-900">{inviteData.code}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  This invite will expire in <span className="font-semibold">7 days</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Need help? <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">Contact Support</a>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AcceptInvite;
