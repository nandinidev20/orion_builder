import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Home,
  Building,
  Headphones,
  BarChart3,
  Settings,
  Menu,
  Bell,
  User,
  Plus,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();

  const navigation = [
  /*   { name: 'Dashboard', href: '/admin', icon: Home }, */
    { name: 'Users', href: '/admin/users', icon: User },
    { name: 'Experiences', href: '/admin/experiences', icon: Headphones },
    { name: 'Create Experience', href: '/admin/create', icon: Plus },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

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
            <Headphones className="text-white" size={24} />
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
        
        <div className="p-4 border-t border-indigo-600 space-y-3">
          <div className="flex items-center">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 flex items-center justify-center">
              <User size={20} />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs text-indigo-200">admin@orionartd.com</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
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
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8 flex items-center justify-center">
                    <User size={16} />
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">Admin</span>
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
    </div>
  );
};

export default AdminLayout;
