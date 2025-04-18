import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser, login as authLogin, logout as authLogout, UserModel } from '@/lib/auth';

interface UseAuthStateProps {
  redirectTo?: string;
  redirectIfAuthenticated?: boolean;
}

export default function useAuthState(props: UseAuthStateProps = {}) {
  const { redirectTo = '/auth/login', redirectIfAuthenticated = false } = props;
  const [user, setUser] = useState<UserModel | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for user on component mount
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);

    // Handle redirection if needed
    if (redirectIfAuthenticated && currentUser) {
      router.push('/admin');
    } else if (!redirectIfAuthenticated && !currentUser && router.pathname !== redirectTo) {
      router.push(redirectTo);
    }
  }, [redirectIfAuthenticated, redirectTo, router]);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { user } = await authLogin(email, password);
      setUser(user);
      return { success: true, user };
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authLogout();
      setUser(null);
      router.push(redirectTo);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, [router, redirectTo]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout
  };
} 