
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  setAuthSession: (session: Session | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Admin check logic with specific credentials (trayectolabs@gmail.com)
  const checkAdminStatus = (currentUser: User | null) => {
    if (!currentUser) return false;
    
    const email = currentUser.email?.toLowerCase() || '';
    const ADMIN_EMAIL = 'trayectolabs@gmail.com';
    
    return email === ADMIN_EMAIL;
  };

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession?.user?.email);
        
        // Only update state directly with synchronous operations
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        const adminStatus = checkAdminStatus(currentSession?.user ?? null);
        setIsAdmin(adminStatus);

        // Store authentication state in localStorage for other components
        if (currentSession) {
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('userEmail', currentSession.user.email || '');
          localStorage.setItem('isAdmin', adminStatus ? 'true' : 'false');

          // Only fetch additional user data if needed
          if (event === 'SIGNED_IN') {
            setTimeout(() => {
              toast.success("Inicio de sesión exitoso");
            }, 0);
          }
        } else {
          // Clear ALL auth data from localStorage when session is null
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('isAdmin');
          
          if (event === 'SIGNED_OUT') {
            setTimeout(() => {
              toast.info("Sesión cerrada");
            }, 0);
          }
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Initial session check:", currentSession?.user?.email);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsAdmin(checkAdminStatus(currentSession?.user ?? null));
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
      
      // Getting the session right after login to ensure we have the latest data
      const { data } = await supabase.auth.getSession();
      const adminStatus = checkAdminStatus(data.session?.user ?? null);
      
      // Update the admin status
      setIsAdmin(adminStatus);
      if (adminStatus) {
        console.log("Admin user logged in");
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesión');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: userData
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Registro exitoso. Por favor verifique su correo electrónico.');
    } catch (error: any) {
      toast.error(error.message || 'Error al registrarse');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      // First clear all local storage items to prevent any state persistence issues
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('isAdmin');
      
      // Then call Supabase signOut
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // Clear ALL auth data
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      
    } catch (error: any) {
      toast.error(error.message || 'Error al cerrar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const setAuthSession = (newSession: Session | null) => {
    setSession(newSession);
    setUser(newSession?.user ?? null);
    setIsAdmin(checkAdminStatus(newSession?.user ?? null));
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        session, 
        isLoading,
        isAdmin,
        signIn,
        signUp,
        signOut,
        setAuthSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
