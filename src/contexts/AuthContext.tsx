import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'L1' | 'L2' | 'L3' | null;

interface AnalystData {
  id: string;
  code: string;
  name: string;
  email: string;
  role: UserRole;
  // Add other analyst fields as needed
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole;
  analyst: AnalystData | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>(null);
  const [analyst, setAnalyst] = useState<AnalystData | null>(null);

  // Function to fetch analyst data from analysts table
  const fetchAnalystData = async (email: string) => {
    console.log('Fetching analyst data for:', email);
    try {
      const queryTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Analyst data query timed out')), 5000) // 5 seconds timeout
      );

      const { data, error } = await Promise.race([
        supabase.from('analysts').select('*').eq('email', email).single(),
        queryTimeoutPromise
      ]) as { data: AnalystData | null, error: PostgrestError | null };
      
      
      console.log('Analyst data response received');
      
      if (error) {
        console.error('Error in analyst data query:', error);
        // If no rows found, return null instead of throwing
        if (error.code === 'PGRST116') { // No rows returned
          console.log('No analyst found with email:', email);
          return null;
        }
        throw error;
      }
      
      if (data) {
        const analystData = {
          id: data.id,
          code: data.code,
          name: data.name,
          email: data.email,
          role: (data.role as UserRole) || 'L1',
        };
        
        console.log('Setting analyst data', data);
        setRole(analystData.role);
        setAnalyst(analystData);
        return analystData;
      }
      
      console.log('No analyst data found for email:', email);
      return null;
    } catch (error) {
      console.error('Error in fetchAnalystData:', error);
      // Create a default analyst if the query fails
      const defaultAnalyst = {
        id: 'temp_' + Date.now(),
        code: 'USER',
        name: email.split('@')[0],
        email,
        role: 'L1' as UserRole,
      };
      setRole('L1');
      setAnalyst(defaultAnalyst);
      return defaultAnalyst;
    }
  };

  useEffect(() => {
    let isMounted = true;
    // setLoading(true); // Already true by default, and handled by the initial onAuthStateChange
    console.log('AuthProvider mounted, setting up auth state listener');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', { event, session });
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user?.email) {
          console.log('Session has user email, fetching analyst data');
          await fetchAnalystData(session.user.email);
        } else {
          console.log('No session or email, resetting role and analyst');
          setRole(null);
          setAnalyst(null);
        }
        // Set loading to false only after the initial state is fully processed
        setLoading(false);
        console.log('Auth state processed, setting loading to false');
      }
    );

    // No need for initializeAuth anymore, onAuthStateChange handles initial state
    // initializeAuth(); // REMOVE THIS

    return () => {
      console.log('AuthProvider unmounting');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    role,
    analyst,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
};
