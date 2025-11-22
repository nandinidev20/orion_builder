import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      Swal.fire('Error', 'Please enter your email address', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        Swal.fire('Error', data.message || 'Failed to send reset link', 'error');
        return;
      }

      setEmailSent(true);
      Swal.fire(
        'Check Your Email',
        'If an account with this email exists, we have sent a password reset link to your email address.',
        'success'
      );
    } catch (error) {
      Swal.fire('Error', error.message || 'An error occurred', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {!emailSent ? (
          <>
            <div className="text-center mb-8">
              <div className="mx-auto bg-indigo-100 rounded-xl w-16 h-16 flex items-center justify-center mb-4">
                <Mail className="text-indigo-600" size={32} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Forgot Password?</h1>
              <p className="text-gray-600 mt-2">No worries! Enter your email and we'll send you a reset link.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  We'll send a password reset link to this email address
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-6">
              <Link
                to="/login"
                className="flex items-center justify-center space-x-2 text-indigo-600 hover:text-indigo-700 font-medium transition"
              >
                <ArrowLeft size={18} />
                <span>Back to Login</span>
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="mx-auto bg-green-100 rounded-xl w-16 h-16 flex items-center justify-center mb-4">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Email Sent!</h2>
              <p className="text-gray-600 mb-4">
                If an account with <strong>{email}</strong> exists, we've sent a password reset link to your email.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                The link will expire in 1 hour for security reasons.
              </p>
              <p className="text-sm text-gray-600 mb-6">
                Please check your email inbox and spam folder if you don't see the email.
              </p>
              <Link
                to="/login"
                className="w-full inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors text-center"
              >
                Return to Login
              </Link>
            </div>
          </>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
