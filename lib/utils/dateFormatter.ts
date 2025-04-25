/**
 * Date Formatting Utility
 * 
 * Provides functions to format dates in user-friendly formats based on the user's browser timezone.
 */

/**
 * Format a date or date string as a full date and time
 * @param dateInput Date object or date string
 * @param options Optional Intl.DateTimeFormatOptions
 * @returns Formatted date and time string
 */
export const formatDateTime = (
  dateInput: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
): string => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  try {
    return new Intl.DateTimeFormat(navigator.language || 'en-US', options).format(date);
  } catch (error) {
    return new Intl.DateTimeFormat('en-US', options).format(date);
  }
};

/**
 * Format a date or date string as a date only
 * @param dateInput Date object or date string
 * @returns Formatted date string
 */
export const formatDate = (dateInput: Date | string): string => {
  return formatDateTime(dateInput, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format a date or date string as a time only
 * @param dateInput Date object or date string
 * @returns Formatted time string
 */
export const formatTime = (dateInput: Date | string): string => {
  return formatDateTime(dateInput, {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format a date or date string as a relative time (e.g., "2 hours ago", "Yesterday", "in 2 days", etc.)
 * @param dateInput Date object or date string
 * @returns Relative time string
 */
export const formatRelativeTime = (dateInput: Date | string): string => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const isFuture = diffMs < 0;
  
  // Get absolute difference values
  const absDiffMs = Math.abs(diffMs);
  const absDiffSecs = Math.floor(absDiffMs / 1000);
  const absDiffMins = Math.floor(absDiffSecs / 60);
  const absDiffHours = Math.floor(absDiffMins / 60);
  const absDiffDays = Math.floor(absDiffHours / 24);
  
  // Less than a minute
  if (absDiffSecs < 60) {
    return isFuture ? 'In a moment' : 'Just now';
  }
  
  // Less than an hour
  if (absDiffMins < 60) {
    return isFuture
      ? `In ${absDiffMins} ${absDiffMins === 1 ? 'minute' : 'minutes'}`
      : `${absDiffMins} ${absDiffMins === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // Less than a day
  if (absDiffHours < 24) {
    return isFuture
      ? `In ${absDiffHours} ${absDiffHours === 1 ? 'hour' : 'hours'}`
      : `${absDiffHours} ${absDiffHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Less than a week
  if (absDiffDays < 7) {
    if (absDiffDays === 1) {
      return isFuture ? 'Tomorrow' : 'Yesterday';
    }
    return isFuture
      ? `In ${absDiffDays} days`
      : `${absDiffDays} days ago`;
  }
  
  // Default to standard date format for older dates
  return formatDate(date);
}; 