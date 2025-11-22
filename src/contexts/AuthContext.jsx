import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [subdomain, setSubdomain] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on initial load
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedSubdomain = localStorage.getItem('subdomain');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    if (storedSubdomain) {
      setSubdomain(storedSubdomain);
    }

    setLoading(false);
  }, []);

  const login = (token, user, subdomain) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('subdomain', subdomain || '');

    // Store individual user properties for backward compatibility
    if (user.id) {
      localStorage.setItem('userId', user.id);
    }
    if (user.studioId) {
      localStorage.setItem('studioId', user.studioId);
    }
    if (user.studioName) {
      localStorage.setItem('studioName', user.studioName);
    }

    setToken(token);
    setUser(user);
    setSubdomain(subdomain);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('subdomain');
    localStorage.removeItem('userId');
    localStorage.removeItem('studioId');
    localStorage.removeItem('studioName');

    setToken(null);
    setUser(null);
    setSubdomain(null);

    // Use window.location to redirect instead of useNavigate to avoid context issues
    window.location.href = '/login';
  };

  const value = {
    user,
    token,
    subdomain,
    login,
    logout,
    isAuthenticated: !!token,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
