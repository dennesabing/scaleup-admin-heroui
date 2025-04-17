import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth, removeAuth, removeCurrentUser } from './auth';

interface UseAuthOptions {
  redirectTo?: string;
  redirectIfFound?: boolean;
}

/**
 * Hook to protect routes that require authentication
 * 
 * @param options Configuration options
 * @param options.redirectTo Where to redirect if authentication fails (default: '/auth/login')
 * @param options.redirectIfFound Redirect if auth is found (for login pages, default: false)
 * 
 * @returns Object with isAuthenticated flag
 */
export function useAuth(options: UseAuthOptions = {}) {
  const { redirectTo = '/auth/login', redirectIfFound = false } = options;
  const router = useRouter();
  
  useEffect(() => {
    // If no window, we're on the server, so do nothing
    if (typeof window === 'undefined') return;

    const auth = getAuth();
    
    // If redirectIfFound is true, redirect if auth is found
    // This is useful for pages like login that should redirect to dashboard if already logged in
    if (redirectIfFound && auth) {
      router.push('/admin');
      return;
    }
    
    // Otherwise, redirect if auth is not found (for protected pages)
    if (!redirectIfFound && !auth) {
      // Clean up any stale auth data
      removeAuth();
      removeCurrentUser();
      
      // Redirect to login page with return URL
      router.push({
        pathname: redirectTo,
        query: { returnUrl: router.asPath }
      });
    }
  }, [redirectIfFound, redirectTo, router]);
  
  return { isAuthenticated: !!getAuth() };
} 