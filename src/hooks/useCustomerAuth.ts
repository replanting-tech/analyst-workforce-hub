
import { useState, useEffect } from 'react';

interface CustomerUser {
  id: string;
  email: string;
  full_name: string;
  customer_id: string;
  role: string;
}

const USER_SESSION_KEY = 'customer_auth_session';

const saveUserToStorage = (user: CustomerUser | null) => {
  if (user) {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_SESSION_KEY);
  }
};

const getUserFromStorage = (): CustomerUser | null => {
  if (typeof window === 'undefined') return null;
  
  const userData = localStorage.getItem(USER_SESSION_KEY);
  if (!userData) return null;

  try {
    return JSON.parse(userData);
  } catch (error) {
    console.error('Failed to parse user data from storage', error);
    return null;
  }
};

export const useCustomerAuth = () => {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load user from storage on initial render
  useEffect(() => {
    const storedUser = getUserFromStorage();
    if (storedUser) {
      setUser(storedUser);
    }
    setLoading(false);
    setIsInitialized(true);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // For demo purposes, we'll use the dummy credentials
      if (email === 'customer@test.com' && password === 'password') {
        const mockUser: CustomerUser = {
          id: '1',
          email: 'customer@test.com',
          full_name: 'Test Customer User',
          customer_id: '85ea3b8a-5cb8-48d7-9b32-2e21af0d8665',
          role: 'admin'
        };
        setUser(mockUser);
        saveUserToStorage(mockUser);
        return { success: true, user: mockUser };
      } else {
        return { success: false, error: 'Invalid email or password' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    saveUserToStorage(null);
  };

  return {
    user,
    login,
    logout,
    loading: loading || !isInitialized,
    isAuthenticated: !!user
  };
};
