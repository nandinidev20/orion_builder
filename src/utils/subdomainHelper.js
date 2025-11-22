/**
 * Get the subdomain-based URL for the application
 * @param {string} subdomain - The studio subdomain
 * @param {string} path - The path to navigate to (default: '/')
 * @returns {string} - The full URL with subdomain
 */
export const getSubdomainURL = (subdomain, path = '/') => {
  if (!subdomain) {
    return path;
  }

  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  const baseDomainEnv = import.meta.env.VITE_FRONTEND_BASE_DOMAIN || '';
  
  if (hostname === 'localhost') {
    // Development: localhost
    return `${import.meta.env.VITE_FRONTEND_BASE_URL || 'http://localhost:5173'}${path}`;
  } else if (hostname.includes('lvh.me')) {
    // Development: lvh.me with subdomain
    return `http://${subdomain}.lvh.me:5173${path}`;
  } else {
    // Production: extract base domain and add subdomain
    let baseDomain = hostname;
    
    // If there's a configured base domain, use it to extract the actual base
    if (baseDomainEnv) {
      // Remove port number if present in the configured base domain
      const cleanBaseDomainEnv = baseDomainEnv.split(':')[0]; // Remove port if present
      
      if (cleanBaseDomainEnv.includes('.')) {
        // Extract the base domain from the environment variable
        const envParts = cleanBaseDomainEnv.split('.');
        if (envParts.length >= 2) {
          const domainParts = hostname.split('.');
          // Take the last parts that match the base domain structure
          const baseDomainParts = domainParts.slice(-(envParts.length));
          baseDomain = baseDomainParts.join('.');
        }
      }
    } else {
      // Check if there's a BASE_DOMAIN environment variable (for production)
      const baseDomainFromEnv = import.meta.env.VITE_BASE_DOMAIN || '';
      if (baseDomainFromEnv && baseDomainFromEnv.includes('.')) {
        baseDomain = baseDomainFromEnv;
      } else {
        // Fallback: try to extract base domain by removing first subdomain part
        const hostnameParts = hostname.split('.');
        if (hostnameParts.length > 2) {
          // Keep the last two parts as base domain (e.g., domain.com)
          baseDomain = hostnameParts.slice(-2).join('.');
        }
      }
    }

    return `https://${subdomain}.${baseDomain}${path}`;
  }
};

/**
 * Get the current subdomain from localStorage
 * @returns {string|null} - The current subdomain or null
 */
export const getCurrentSubdomain = () => {
  return localStorage.getItem('subdomain');
};

/**
 * Check if user is logged in
 * @returns {boolean} - True if user has a token and subdomain
 */
export const isUserLoggedIn = () => {
  const token = localStorage.getItem('token');
  const subdomain = localStorage.getItem('subdomain');
  return !!token && !!subdomain;
};

/**
 * Navigate to a path with subdomain if user is logged in
 * @param {string} path - The path to navigate to
 */
export const navigateWithSubdomain = (path) => {
  const subdomain = getCurrentSubdomain();
  if (subdomain) {
    window.location.href = getSubdomainURL(subdomain, path);
  } else {
    window.location.href = path;
  }
};

// Example scenarios this fixes:
// 1. User on main domain (werbz.com) -> Login -> Redirect to subdomain.werbz.com ✓
// 2. User already on subdomain (vexihep.werbz.com) -> Login -> Redirect to subdomain.werbz.com (not vexihep.vexihep.werbz.com) ✓
