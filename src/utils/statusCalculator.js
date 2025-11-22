/**
 * Calculate the dynamic status of an experience based on start/end dates and user timezone
 * @param {string|Date} startDate - The start date/time of the experience
 * @param {string|Date} endDate - The end date/time of the experience
 * @returns {string} The status: 'scheduled', 'active', or 'expired'
 */
export const calculateExperienceStatus = (startDate, endDate) => {
  // Get user's timezone offset
  const userTimezoneOffset = new Date().getTimezoneOffset() * 60000; // in milliseconds

  // Convert to Date objects if they're strings
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  // Get current time adjusted for user's timezone
  const now = new Date();

  // If no dates are provided, status cannot be determined
  if (!start && !end) {
    return 'scheduled';
  }

  // Check if experience has started
  if (start && now < start) {
    return 'scheduled';
  }

  // Check if experience has ended
  if (end && now > end) {
    return 'expired';
  }

  // Experience is within the active window
  return 'active';
};

/**
 * Get the appropriate color class for status display
 * @param {string} status - The status: 'scheduled', 'active', or 'expired'
 * @returns {string} Tailwind CSS classes for the status badge
 */
export const getStatusColorClass = (status) => {
  const colors = {
    scheduled: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
    draft: 'bg-gray-100 text-gray-800'
  };
  return colors[status] || colors.draft;
};

/**
 * Get the appropriate label for the status
 * @param {string} status - The status: 'scheduled', 'active', or 'expired'
 * @returns {string} Human-readable status label
 */
export const getStatusLabel = (status) => {
  const labels = {
    scheduled: 'Scheduled',
    active: 'Active',
    expired: 'Expired',
    draft: 'Draft',
    published: 'Published',
    archived: 'Archived'
  };
  return labels[status] || 'Unknown';
};

/**
 * Check if an experience is accessible (not expired)
 * @param {string} status - The dynamic status
 * @returns {boolean} True if experience is accessible
 */
export const isExperienceAccessible = (status) => {
  return status !== 'expired';
};

/**
 * Check if an experience is currently playable (active and within time window)
 * @param {string} status - The dynamic status
 * @returns {boolean} True if experience is currently playable
 */
export const isExperiencePlayable = (status) => {
  return status === 'active';
};

/**
 * Format a date for display
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDateDisplay = (date) => {
  if (!date) return 'Not set';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
