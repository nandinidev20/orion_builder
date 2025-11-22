/**
 * Get user's timezone from browser
 * Returns IANA timezone string (e.g., "America/New_York")
 */
export function getUserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Error detecting timezone:', error);
    return 'UTC';
  }
}

/**
 * Get timezone offset in milliseconds from UTC
 * Positive for timezones behind UTC, negative for ahead
 */
export function getTimezoneOffsetMs() {
  return new Date().getTimezoneOffset() * 60 * 1000;
}

/**
 * Convert local date/time string to UTC Date object
 * @param {string} dateStr - Date string in format "YYYY-MM-DD"
 * @param {string} timeStr - Time string in format "HH:MM"
 * @returns {Date} - UTC Date object
 */
export function localToUTC(dateStr, timeStr) {
  if (!dateStr) {
    return null;
  }

  const time = timeStr || '00:00';
  const localDateTimeStr = `${dateStr}T${time}:00`;

  // When passing a datetime string without Z to new Date(), JavaScript interprets it as
  // local browser time and automatically stores the UTC equivalent internally.
  // No adjustment needed - the Date object is already correct!
  const utcDate = new Date(localDateTimeStr);

  if (isNaN(utcDate.getTime())) {
    throw new Error(`Invalid date/time format: ${localDateTimeStr}`);
  }

  return utcDate;
}

/**
 * Convert UTC Date object to local date/time strings
 * Extracts local year, month, day, hours, minutes for display in form fields
 * @param {Date|string} utcDate - UTC Date object or ISO string
 * @returns {object} - { date: "YYYY-MM-DD", time: "HH:MM" }
 */
export function utcToLocal(utcDate) {
  if (!utcDate) {
    return { date: '', time: '' };
  }

  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${utcDate}`);
  }

  // Use local methods (not UTC methods) to get the browser's local date/time
  // JavaScript Date automatically handles timezone conversion
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`
  };
}

/**
 * Parse UTC date for comparisons
 * JavaScript Date objects handle timezones automatically, so no conversion needed.
 * Just parse the UTC string and use for comparisons - JavaScript will compare correctly.
 * @param {Date|string} utcDate - UTC Date object or ISO string
 * @returns {Date} - Date object for comparisons (stored as UTC internally)
 */
export function utcToLocalDate(utcDate) {
  if (!utcDate) {
    return null;
  }

  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;

  if (isNaN(date.getTime())) {
    return null;
  }

  // No conversion needed - JavaScript Date handles timezones automatically
  // This Date object stores UTC internally and comparisons work correctly
  return date;
}

/**
 * Format a UTC date/time for display in user's local timezone
 * @param {Date|string} utcDate - UTC Date object or ISO string
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date/time string
 */
export function formatUTCToLocal(utcDate, options = {}) {
  if (!utcDate) {
    return '';
  }

  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;

  if (isNaN(date.getTime())) {
    return '';
  }

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };

  try {
    return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}
