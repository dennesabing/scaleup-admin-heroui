/**
 * Formats an avatar URL to use the new /avatar path instead of /api/avatars
 * @param url The original avatar URL or filename
 * @returns The formatted avatar URL
 */
export const getAvatarUrl = (url: string | undefined | null): string => {
  if (!url) {
    return '';
  }

  // If the URL is already a full URL (http/https), return it as is
  if (url.startsWith('http')) {
    return url;
  }

  // If the URL is already a relative path that doesn't need formatting, return it as is
  if (url.startsWith('/avatar/')) {
    return url;
  }

  // If the URL is an API avatar path, convert it to the new format
  if (url.startsWith('/api/avatars/')) {
    return url.replace('/api/avatars/', '/avatar/');
  }

  // If it's just a filename (without path), assume it's an avatar and add the path
  if (!url.includes('/')) {
    return `/avatar/${url}`;
  }

  // For all other cases, return the URL as is
  return url;
}; 