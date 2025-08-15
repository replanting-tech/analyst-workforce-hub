import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
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
    let queryTimeout: NodeJS.Timeout;
    
    try {
      // Add a timeout to the query
      const queryPromise = supabase
        .from('analysts')
        .select('*')
        .eq('email', email)
        .single();
        
      const timeoutPromise = new Promise((_, reject) => {
        queryTimeout = setTimeout(() => {
          reject(new Error('Analyst data query timed out after 5 seconds'));
        }, 5000);
      });

      const { data, error } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as { data: any, error: any };
      
      clearTimeout(queryTimeout);
      
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
        
        console.log('Setting analyst data');
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
    } finally {
      clearTimeout(queryTimeout);
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    console.log('AuthProvider mounted, setting loading to true');

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
      }
    );

    // Initial check for existing session with timeout
    const initializeAuth = async () => {
      console.log('Initializing auth...');
      let sessionCheckTimeout: NodeJS.Timeout;
      
      try {
        // Add a timeout to the session check
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          sessionCheckTimeout = setTimeout(() => {
            reject(new Error('Session check timed out after 5 seconds'));
          }, 5000);
        });

        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as { data: { session: any }, error: any };
        
        clearTimeout(sessionCheckTimeout);
        
        console.log('Initial session check:', { session, error });
        
        if (isMounted) {
          if (error) {
            console.error('Error getting session:', error);
            throw error;
          }
          
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user?.email) {
            console.log('Initial session has email, fetching analyst data');
            await fetchAnalystData(session.user.email);
          } else {
            console.log('No initial session or email');
            setRole(null);
            setAnalyst(null);
          }
        }
      } catch (error) {
        console.error('Error in initializeAuth:', error);
        // Ensure we clear the loading state even if there's an error
        if (isMounted) {
          console.log('Auth initialization failed, setting loading to false');
          setLoading(false);
          // Set default values to ensure app doesn't get stuck
          setSession(null);
          setUser(null);
          setRole(null);
          setAnalyst(null);
        }
      } finally {
        if (isMounted) {
          console.log('Auth initialization complete, setting loading to false');
          setLoading(false);
          clearTimeout(sessionCheckTimeout); // Clean up timeout in case it's still pending
        }
      }
    };

    initializeAuth();

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
      {children}
    </AuthContext.Provider>
  );
};
