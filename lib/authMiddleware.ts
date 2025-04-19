import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth, removeAuth, removeCurrentUser } from './auth';
import { redirectWithMessage } from './navigation';

interface UseAuthOptions {
  redirectTo?: string;
  redirectIfFound?: boolean;
  redirectMessage?: string;
}

/**
 * Hook to protect routes that require authentication
 * 
 * @param options Configuration options
 * @param options.redirectTo Where to redirect if authentication fails (default: '/auth/login')
 * @param options.redirectIfFound Redirect if auth is found (for login pages, default: false)
 * @param options.redirectMessage Optional message to display after redirect
 * 
 * @returns Object with isAuthenticated flag
 */
export function useAuth(options: UseAuthOptions = {}) {
  const { 
    redirectTo = '/auth/login', 
    redirectIfFound = false,
    redirectMessage 
  } = options;
  const router = useRouter();
  
  useEffect(() => {
    // If no window, we're on the server, so do nothing
    if (typeof window === 'undefined') return;

    const auth = getAuth();
    
    // If redirectIfFound is true, redirect if auth is found
    // This is useful for pages like login that should redirect to dashboard if already logged in
    if (redirectIfFound && auth) {
      if (redirectMessage) {
        redirectWithMessage(router, '/admin', redirectMessage);
      } else {
        router.push('/admin');
      }
      return;
    }
    
    // Otherwise, redirect if auth is not found (for protected pages)
    if (!redirectIfFound && !auth) {
      // Clean up any stale auth data
      removeAuth();
      removeCurrentUser();
      
      // Redirect to login page with optional message
      if (redirectMessage) {
        redirectWithMessage(router, redirectTo, redirectMessage, { replace: true });
      } else {
        // Store the current URL as returnUrl for after login (if no message)
        router.push({
          pathname: redirectTo,
          query: { returnUrl: router.asPath }
        });
      }
    }
  }, [redirectIfFound, redirectTo, redirectMessage, router]);
  
  return { isAuthenticated: !!getAuth() };
} 