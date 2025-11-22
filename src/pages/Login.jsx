import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { getSubdomainURL } from '../utils/subdomainHelper';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
      // Call the login API
      const response = await authAPI.login(email, password);
      console.log(response.data.user.role);

      const { subdomain } = response.data.user;

      // Use AuthContext to store user data and token
      authLogin(response.data.token, response.data.user, subdomain);

      // Redirect based on user role and construct subdomain URL
      if (response.data.user.role === 'admin') {
        navigate('/admin/users');
      } else if (response.data.user.role === 'studio') {
        // Redirect to the subdomain URL using helper
        const studioUrl = getSubdomainURL(subdomain, '/studio');
        window.location.href = studioUrl;
      }
    } catch (error) {
      // Handle error
      console.error('Login error:', error);
      // Check if the error message is about a suspended account
      if (error.response?.data?.message === 'Your account has been suspended' ||
          error.response?.data?.message === 'Your studio account has been suspended') {
        setErrors({ api: error.response.data.message });
      } else {
        setErrors({ api: error.message || 'Login failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center mb-4">
            <span className="text-2xl">🎧</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-90">OrionArtd</h1>
          <p className="text-gray-600 mt-2">Experience Management Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className={`w-full px-4 py-3 border ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition`}
              placeholder="Enter your email"
              required
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className={`w-full px-4 py-3 border ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition`}
              placeholder="Enter your password"
              required
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {errors.api && (
            <div className="text-red-600 text-center py-2 bg-red-50 rounded-lg">
              {errors.api}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full ${
                isLoading 
                  ? 'bg-indigo-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } text-white py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition font-medium`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-600 hover:text-indigo-500 font-medium">
              Sign up
            </Link>
          </p>
          <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-500 mt-2 block font-medium">
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
