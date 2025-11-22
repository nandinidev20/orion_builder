import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const SetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [studioData, setStudioData] = useState({
    subdomain: '',
    studioName: '',
    studioId: ''
  });

  // Extract parameters from URL
  useEffect(() => {
    const subdomain = searchParams.get('subdomain');
    const studioName = searchParams.get('studioName');
    const studioId = searchParams.get('studioId');
    
    setStudioData({
      subdomain: subdomain || '',
      studioName: studioName ? decodeURIComponent(studioName) : '',
      studioId: studioId || ''
    });
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Call API to set password
      const response = await authAPI.setPasswordForStudio(
        studioData.studioId || `mock-studio-id-${studioData.subdomain}`, // Use actual studio ID if available, otherwise fallback to mock
        formData.password
      );

      if (response.success) {
        // Store the token and user information in localStorage (matching Login.jsx structure)
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', response.data.user.role);
        localStorage.setItem('userId', response.data.user.id);
        localStorage.setItem('studioId', response.data.user.studioId);
        localStorage.setItem('studioName', response.data.user.studioName);
        // Store subdomain encrypted (using base64 encoding)
        const encryptedSubdomain = btoa(response.data.user.studio_subdomain);
        localStorage.setItem('studioSubdomain', encryptedSubdomain);
        
        setSuccess(true);
        console.log(response.data.user.studio_subdomain);
        // Construct the subdomain URL and redirect
        console.log(`Subdomain: ${response.data.user.studio_subdomain}`);
        const baseDomain = import.meta.env.VITE_FRONTEND_BASE_DOMAIN || 'lvh.me:5173';
        console.log(`Base domain: ${baseDomain}`);
        const redirectUrl = `http://${response.data.user.studio_subdomain}.${baseDomain}/studio`;
        console.log(`Redirecting to: ${redirectUrl}`);
        window.location.href = redirectUrl;
      } else {
        setError('Failed to set password. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while setting the password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="text-green-50 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-80 mb-2">Studio Created Successfully!</h1>
          
          <div className="bg-green-50 border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Your studio <span className="font-bold">{studioData.studioName}</span> has been created!</p>
            <p className="mt-1">Please set the password to complete the registration.</p>
          </div>
          
          <p className="text-gray-600">
            You will be redirected to the studio dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Complete Registration</h1>
          <p className="text-gray-600 mt-2">
            Your studio <span className="font-semibold">{studioData.studioName}</span> has been created!
          </p>
          <p className="text-gray-600">
            Please set your password to complete the registration.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Enter your password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Confirm your password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-60 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Setting Password...
              </span>
            ) : (
              'Set Password & Complete Registration'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Studio: <span className="font-medium">{studioData.studioName}</span></p>
          <p className="mt-1">Subdomain: <span className="font-mono bg-gray-10 px-2 py-1 rounded">{studioData.subdomain}.apb.in</span></p>
        </div>
      </div>
    </div>
  );
};

export default SetPassword;
