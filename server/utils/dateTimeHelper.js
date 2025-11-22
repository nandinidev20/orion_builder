/**
 * Combine date and time strings into a proper ISO datetime
 * @param {string} dateStr - Date string in format "YYYY-MM-DD"
 * @param {string} timeStr - Time string in format "HH:MM"
 * @returns {Date} - JavaScript Date object
 */
export function combineDateAndTime(dateStr, timeStr) {
  if (!dateStr) {
    return null;
  }

  // If no time is provided, default to midnight
  const time = timeStr || '00:00';

  // Combine date and time strings
  const dateTimeStr = `${dateStr}T${time}:00`;

  // Create a Date object from the combined string
  // This will be interpreted as UTC/local time based on browser/server timezone
  const date = new Date(dateTimeStr);

  // Validate the date
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date/time format: ${dateTimeStr}`);
  }

  return date;
}

/**
 * Process experience data - handles dates that may come as ISO strings (UTC) or as date/time parts
 * Frontend now sends UTC ISO strings directly, so we just ensure proper Date objects
 * @param {object} experienceData - Experience data object
 * @returns {object} - Experience data with proper Date objects
 */
export function processExperienceDates(experienceData) {
  const processed = { ...experienceData };

  // If startDate is an ISO string (from frontend UTC conversion), keep it as is
  if (processed.startDate && typeof processed.startDate === 'string') {
    processed.startDate = new Date(processed.startDate);
  }

  // If endDate is an ISO string (from frontend UTC conversion), keep it as is
  if (processed.endDate && typeof processed.endDate === 'string') {
    processed.endDate = new Date(processed.endDate);
  }

  // Clear startTime and endTime since they're now part of the dates
  if (processed.startDate) {
    processed.startTime = null;
  }
  if (processed.endDate) {
    processed.endTime = null;
  }

  return processed;
}
