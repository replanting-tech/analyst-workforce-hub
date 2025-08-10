
import { useState } from 'react';

interface CustomerUser {
  id: string;
  email: string;
  full_name: string;
  customer_id: string;
  role: string;
}

export const useCustomerAuth = () => {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // For demo purposes, we'll use the dummy credentials
      if (email === 'customer@test.com' && password === 'password') {
        const mockUser: CustomerUser = {
          id: '1',
          email: 'customer@test.com',
          full_name: 'Test Customer User',
          customer_id: '1',
          role: 'admin'
        };
        setUser(mockUser);
        return { success: true, user: mockUser };
      } else {
        return { success: false, error: 'Invalid email or password' };
      }
    } catch (error) {
      return { success: false, error: 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  };
};
