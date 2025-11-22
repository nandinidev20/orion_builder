/**
 * Calculate the dynamic status of an experience based on start/end dates and timezone
 * @param {Date} startDate - The start date/time of the experience
 * @param {Date} endDate - The end date/time of the experience
 * @param {string} userTimezone - The user's timezone (e.g., 'America/New_York', 'UTC', etc.)
 * @returns {string} The status: 'scheduled', 'active', or 'expired'
 */
export const calculateDynamicStatus = (startDate, endDate, userTimezone = 'UTC') => {
  // If no dates are provided, status cannot be determined
  if (!startDate && !endDate) {
    return 'scheduled';
  }

  // Create a formatter to convert dates to user's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: userTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  // Get current time in user's timezone
  const now = new Date();
  const userLocalTime = new Date(
    formatter.format(now).replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, '$3-$1-$2T$4:$5:$6')
  );

  // Convert timezone offset to milliseconds
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
  const offset = now.getTime() - utcDate.getTime();
  const adjustedNow = new Date(now.getTime() - offset);

  // Check if experience has started
  if (startDate && adjustedNow < startDate) {
    return 'scheduled';
  }

  // Check if experience has ended
  if (endDate && adjustedNow > endDate) {
    return 'expired';
  }

  // Experience is within the active window
  return 'active';
};

/**
 * Get the appropriate color class for status display
 * @param {string} status - The status: 'scheduled', 'active', or 'expired'
 * @returns {string} Tailwind CSS class for the status badge
 */
export const getStatusColorClass = (status) => {
  switch (status) {
    case 'scheduled':
      return 'bg-yellow-100 text-yellow-800';
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'expired':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get the appropriate label for the status
 * @param {string} status - The status: 'scheduled', 'active', or 'expired'
 * @returns {string} Human-readable status label
 */
export const getStatusLabel = (status) => {
  switch (status) {
    case 'scheduled':
      return 'Scheduled';
    case 'active':
      return 'Active';
    case 'expired':
      return 'Expired';
    default:
      return 'Unknown';
  }
};

/**
 * Check if an experience is accessible (active or scheduled, not expired)
 * @param {string} status - The dynamic status
 * @returns {boolean} True if experience is accessible
 */
export const isExperienceAccessible = (status) => {
  return status === 'active' || status === 'scheduled';
};

/**
 * Check if an experience is currently playable (active and within time window)
 * @param {string} status - The dynamic status
 * @returns {boolean} True if experience is currently playable
 */
export const isExperiencePlayable = (status) => {
  return status === 'active';
};
