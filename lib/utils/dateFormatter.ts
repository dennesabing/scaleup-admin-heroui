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
 * Format a date or date string as a relative time (e.g., "2 hours ago", "Yesterday", etc.)
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
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  // Less than a minute
  if (diffSecs < 60) {
    return 'Just now';
  }
  
  // Less than an hour
  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // Less than a day
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Less than a week
  if (diffDays < 7) {
    if (diffDays === 1) {
      return 'Yesterday';
    }
    return `${diffDays} days ago`;
  }
  
  // Default to standard date format for older dates
  return formatDate(date);
}; 