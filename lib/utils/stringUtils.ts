/**
 * String utility functions
 */

/**
 * Capitalizes the first letter of a string
 * @param str The string to capitalize
 * @returns The string with the first letter capitalized
 */
export const capitalizeFirstLetter = (str: string): string => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Truncates a string to a specified length and adds an ellipsis
 * @param str The string to truncate
 * @param maxLength The maximum length before truncation
 * @returns The truncated string with ellipsis if necessary
 */
export const truncate = (str: string, maxLength: number): string => {
  if (!str || typeof str !== 'string') return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
};

/**
 * Converts a string to title case (capitalizes the first letter of each word)
 * @param str The string to convert to title case
 * @returns The string in title case
 */
export const toTitleCase = (str: string): string => {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Slugify a string (convert to lowercase, replace spaces with hyphens, remove special chars)
 * @param str The string to slugify
 * @returns The slugified string
 */
export const slugify = (str: string): string => {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Generates initials from a name (takes first letter of first and last name)
 * @param name The name to generate initials from
 * @returns The initials (max 2 characters)
 */
export const getInitials = (name: string): string => {
  if (!name || typeof name !== 'string') return '';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}; 