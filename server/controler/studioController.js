import Studio from '../model/Studio.js';

// Reserved subdomains that cannot be used
const RESERVED_SUBDOMAINS = ['admin', 'api', 'www', 'mail', 'support', 'studio', 'help', 'docs', 'blog'];

/**
 * Check if studio name is available
 * GET /api/studio/check-name/:name
 * Public endpoint - no authentication required
 */
const checkStudioNameAvailability = async (req, res, next) => {
  try {
    const { name } = req.params;

    // Validate input
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Studio name is required'
      });
    }

    const trimmedName = name.trim();

    // Validate length
    if (trimmedName.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Studio name must be at least 3 characters long'
      });
    }

    if (trimmedName.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Studio name must not exceed 50 characters'
      });
    }

    // Check if name exists (case-insensitive)
    const existingStudio = await Studio.findOne({
      name: { $regex: `^${trimmedName}$`, $options: 'i' }
    }).select('_id');

    if (existingStudio) {
      return res.success(
        { available: false },
        'Studio name is already taken'
      );
    }

    res.success(
      { available: true },
      'Studio name is available'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Check if subdomain is available
 * GET /api/studio/check-subdomain/:subdomain
 * Public endpoint - no authentication required
 */
const checkSubdomainAvailability = async (req, res, next) => {
  try {
    const { subdomain } = req.params;

    // Validate input
    if (!subdomain || subdomain.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Subdomain is required'
      });
    }

    const trimmedSubdomain = subdomain.trim().toLowerCase();

    // Validate length
    if (trimmedSubdomain.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Subdomain must be at least 3 characters long'
      });
    }

    if (trimmedSubdomain.length > 63) {
      return res.status(400).json({
        success: false,
        message: 'Subdomain must not exceed 63 characters'
      });
    }

    // Validate format: alphanumeric and hyphens only
    // Cannot start or end with hyphen
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(trimmedSubdomain)) {
      return res.status(400).json({
        success: false,
        message: 'Subdomain can only contain lowercase letters, numbers, and hyphens (cannot start or end with hyphen)'
      });
    }

    // Check if subdomain is reserved
    if (RESERVED_SUBDOMAINS.includes(trimmedSubdomain)) {
      return res.success(
        { available: false },
        'This subdomain is reserved and cannot be used'
      );
    }

    // Check if subdomain exists (case-insensitive)
    const existingStudio = await Studio.findOne({
      subdomain: { $regex: `^${trimmedSubdomain}$`, $options: 'i' }
    }).select('_id');

    if (existingStudio) {
      // Generate suggestions
      const suggestions = generateSubdomainSuggestions(trimmedSubdomain);
      
      return res.success(
        {
          available: false,
          suggestions
        },
        'Subdomain is already taken. Try one of the suggestions.'
      );
    }

    res.success(
      { available: true },
      'Subdomain is available'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Generate alternative subdomain suggestions
 * @param {string} baseSubdomain - The requested subdomain
 * @returns {Array} Array of suggested subdomains
 */
const generateSubdomainSuggestions = (baseSubdomain) => {
  const suggestions = [];
  
  // Add numbered variations
  for (let i = 1; i <= 3; i++) {
    suggestions.push(`${baseSubdomain}-${i}`);
  }

  // Add timestamp-based variation
  const timestamp = Date.now().toString().slice(-4);
  suggestions.push(`${baseSubdomain}-${timestamp}`);

  return suggestions;
};

export {
  checkStudioNameAvailability,
  checkSubdomainAvailability
};
