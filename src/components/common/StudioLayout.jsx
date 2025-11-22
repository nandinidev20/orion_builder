import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  PlusCircle,
  Music,
  BarChart3,
  Settings,
  Menu,
  Bell,
  User,
  LogOut
} from 'lucide-react';
import { newExperienceAPI } from '../../services/api';

const StudioLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [subdomainVerified, setSubdomainVerified] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/studio', icon: Home },
    { name: 'Create Experience', href: '/studio/create', icon: PlusCircle },
    { name: 'My Experiences', href: '/studio/experiences', icon: Music },
   /*  { name: 'Analytics', href: '/studio/analytics', icon: BarChart3 }, */
    { name: 'Settings', href: '/studio/settings', icon: Settings },
  ];

  // Verify subdomain on component mount and when location changes
  useEffect(() => {
    const verifySubdomain = async () => {
      try {
        const storedSubdomain = localStorage.getItem('subdomain');
        const token = localStorage.getItem('token');
        const studioId = localStorage.getItem('studioId');
        console.log('subdomain', storedSubdomain, 'token', token, 'studioId', studioId);
        // If no subdomain or token, user is not logged in - let other auth logic handle it
        if (!storedSubdomain || !token || !studioId) {
          setSubdomainVerified(false);
          return;
        }

        // Fetch the user's studio data to verify subdomain
        try {
          // You can use any authenticated API call to get studio info
          // For now, we'll attempt to get experiences which requires authentication
          const response = await newExperienceAPI.getNewExperiences({ limit: 1 });

          // If we got here, the token is valid
          // Now verify the subdomain matches the current URL
          const currentHostname = window.location.hostname;
          const urlSubdomain = currentHostname.split('.')[0];

          // For localhost, subdomain might not be in URL, so we skip URL validation
          if (currentHostname !== 'localhost' && currentHostname.includes('lvh.me')) {
            if (urlSubdomain !== storedSubdomain) {
              console.warn(`Subdomain mismatch: URL has ${urlSubdomain}, localStorage has ${storedSubdomain}`);
              // Redirect to the correct subdomain
              handleSubdomainMismatch();
              return;
            }
          }

          setSubdomainVerified(true);
        } catch (error) {
          // If API call fails with auth error, user's token might be invalid
          if (error.response?.status === 401 || error.response?.status === 403) {
            console.warn('Authentication failed - token may be invalid');
            handleSubdomainMismatch();
            return;
          }
          // For other errors, still consider subdomain verified
          setSubdomainVerified(true);
        }
      } catch (error) {
        console.error('Error verifying subdomain:', error);
        setSubdomainVerified(true); // Allow access even if verification fails
      }
    };

    verifySubdomain();
  }, []);

  // Handle subdomain mismatch
  const handleSubdomainMismatch = () => {
    // Clear user data
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('studioId');
    localStorage.removeItem('studioName');
    localStorage.removeItem('subdomain');

    // Redirect to login
    window.location.href = `${import.meta.env.VITE_FRONTEND_BASE_URL || 'http://localhost:5173'}/login`;
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('studioId');
    localStorage.removeItem('studioName');
    localStorage.removeItem('subdomain');

    // Clear cookies by setting them to expire in the past
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // Redirect to login page
    navigate('/login');
    setShowLogoutModal(false);
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Show loading state while verifying subdomain
  if (!subdomainVerified) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar backdrop, show/hide based on sidebar mobile state */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 z-50 flex flex-col w-64 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out bg-indigo-700 lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-center h-16 px-4 bg-indigo-800">
          <div className="flex items-center space-x-2">
            <Music className="text-white" size={24} />
            <span className="text-white font-bold text-xl">OrionArtd</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <nav className="px-2 py-5">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      location.pathname === item.href
                        ? 'bg-indigo-800 text-white'
                        : 'text-indigo-100 hover:bg-indigo-600 hover:text-white'
                    } group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition`}
                  >
                    <Icon className="mr-3" size={20} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
        
        <div className="p-4 border-t border-indigo-600">
          <div className="flex items-center">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 flex items-center justify-center">
              <User size={20} />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">Studio User</p>
              <p className="text-xs text-indigo-200">studio@orionartd.com</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="mt-4 w-full flex items-center px-4 py-3 text-sm font-medium text-indigo-100 hover:bg-indigo-600 hover:text-white rounded-lg transition"
          >
            <LogOut className="mr-3" size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top navigation */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <button
                type="button"
                className="lg:hidden text-gray-500 hover:text-gray-600 mr-4"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">Open sidebar</span>
                <Menu size={24} />
              </button>
              <h1 className="text-xl font-semibold text-gray-900 capitalize">
                {location.pathname.split('/').pop() || 'Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-1 text-gray-400 rounded-full hover:text-gray-500 focus:outline-none">
                <span className="sr-only">View notifications</span>
                <Bell size={24} />
              </button>
              
              <div className="relative">
                <div className="flex items-center">
                  <div className="bg-gray-20 border-2 border-dashed rounded-xl w-8 h-8 flex items-center justify-center">
                    <User size={16} />
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">Studio</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {children}
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={cancelLogout}></div>
          <div className="relative bg-white rounded-lg p-6 w-96 max-w-md mx-auto z-10">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioLayout;
