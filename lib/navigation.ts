import { NextRouter } from 'next/router';

/**
 * Navigate to a page with a temporary message that will be displayed once
 * Uses sessionStorage to store the message, which is cleaner than query parameters
 * 
 * @param router Next.js router instance
 * @param path Path to navigate to
 * @param message Message to display on the target page
 * @param options Additional router options
 */
export function redirectWithMessage(
  router: NextRouter, 
  path: string, 
  message: string,
  options?: { replace?: boolean }
): Promise<boolean> {
  if (typeof window !== 'undefined') {
    // Store the message in sessionStorage
    sessionStorage.setItem('alertMessage', message);
  }
  
  // Navigate to the target page without query parameters
  return options?.replace 
    ? router.replace(path) 
    : router.push(path);
}

/**
 * Redirect to login page with a message
 * 
 * @param router Next.js router instance
 * @param message Message to display on the login page
 */
export function redirectToLogin(
  router: NextRouter,
  message: string
): Promise<boolean> {
  return redirectWithMessage(router, '/auth/login', message);
}

/**
 * Redirect to the admin dashboard with a message
 * 
 * @param router Next.js router instance
 * @param message Message to display on the dashboard
 */
export function redirectToAdmin(
  router: NextRouter,
  message: string
): Promise<boolean> {
  return redirectWithMessage(router, '/admin', message);
} 