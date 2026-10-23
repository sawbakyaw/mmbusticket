'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AuthUser, AuthState, SystemRole, UserProfile, Role, Wallet } from '@/lib/types-extended';

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, name: string, phone: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (...roles: SystemRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Public routes that don't require authentication
const publicRoutes = ['/', '/search', '/trip', '/passenger', '/payment', '/confirmation', '/help', '/find-booking', '/login', '/signup', '/forgot-password'];
const authRoutes = ['/login', '/signup', '/forgot-password'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Fetch user profile and wallet
  const fetchUserData = useCallback(async (userId: string): Promise<AuthUser | null> => {
    try {
      // Fetch profile with role
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          roles (*)
        `)
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      // Fetch wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Check if operator user
      const { data: operatorUser } = await supabase
        .from('operator_users')
        .select('operator_id')
        .eq('user_id', userId)
        .maybeSingle();

      // Check if agent user
      const { data: agentUser } = await supabase
        .from('agent_users')
        .select('agent_id')
        .eq('user_id', userId)
        .maybeSingle();

      // Get role from profile or default to customer
      const role = (profile?.roles as Role)?.name || 'customer';

      return {
        id: userId,
        email: '', // Will be filled from auth user
        phone: null,
        role: role as SystemRole,
        profile: profile || null,
        wallet: wallet || null,
        operatorId: operatorUser?.operator_id,
        agentId: agentUser?.agent_id,
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const userData = await fetchUserData(session.user.id);
          if (userData) {
            userData.email = session.user.email || '';
            userData.phone = session.user.phone || null;
          }
          setState({ user: userData, loading: false, error: null });
        } else {
          setState({ user: null, loading: false, error: null });
        }
      } catch (error) {
        console.error('Auth init error:', error);
        setState({ user: null, loading: false, error: 'Failed to initialize auth' });
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userData = await fetchUserData(session.user.id);
        if (userData) {
          userData.email = session.user.email || '';
          userData.phone = session.user.phone || null;
        }
        setState({ user: userData, loading: false, error: null });
      } else if (event === 'SIGNED_OUT') {
        setState({ user: null, loading: false, error: null });
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  // Route protection
  useEffect(() => {
    if (state.loading) return;

    const isPublicRoute = publicRoutes.some(route =>
      route === '/' ? pathname === '/' : pathname === route || pathname?.startsWith(`${route}/`)
    );
    const isAuthRoute = authRoutes.some(route => pathname === route);

    // If trying to access protected route without auth
    if (!isPublicRoute && !state.user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname || '/')}`);
      return;
    }

    // If authenticated and trying to access auth routes
    if (state.user && isAuthRoute) {
      const dashboard = ['super_admin', 'admin'].includes(state.user.role)
        ? '/admin/dashboard'
        : ['operator_admin', 'operator_staff'].includes(state.user.role)
          ? '/operator/dashboard'
          : ['agent_admin', 'agent_staff'].includes(state.user.role)
            ? '/agent/dashboard'
            : '/';
      router.push(dashboard);
      return;
    }

    // Check role-based access for admin/operator/agent portals
    if (state.user) {
      if (pathname?.startsWith('/admin') && !hasRoleAccess(state.user.role, ['super_admin', 'admin'])) {
        router.push('/');
        return;
      }
      if (pathname?.startsWith('/operator') && !hasRoleAccess(state.user.role, ['super_admin', 'admin', 'operator_admin', 'operator_staff'])) {
        router.push('/');
        return;
      }
      if (pathname?.startsWith('/agent') && !hasRoleAccess(state.user.role, ['super_admin', 'admin', 'agent_admin', 'agent_staff'])) {
        router.push('/');
        return;
      }
    }
  }, [state.user, state.loading, pathname, router]);

  // Helper function for role access
  function hasRoleAccess(userRole: SystemRole, allowedRoles: SystemRole[]): boolean {
    return allowedRoles.includes(userRole);
  }

  // Sign up
  const signUp = async (email: string, password: string, name: string, phone: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: data.user.id,
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        // Create wallet for customer
        const { data: roleData } = await supabase
          .from('roles')
          .select('id')
          .eq('name', 'customer')
          .maybeSingle();

        if (roleData) {
          await supabase
            .from('user_profiles')
            .update({ role_id: roleData.id })
            .eq('user_id', data.user.id);
        }

        // Create wallet
        await supabase
          .from('wallets')
          .insert({
            user_id: data.user.id,
            wallet_type: 'user',
          });
      }

      return { error: null };
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  // Sign in
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      // Update last login
      if (data.user) {
        await supabase
          .from('user_profiles')
          .update({
            last_login_at: new Date().toISOString(),
            last_login_ip: '', // Would need server action for real IP
            failed_login_attempts: 0,
          })
          .eq('user_id', data.user.id);
      }

      return { error: null };
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    setState({ user: null, loading: false, error: null });
    router.push('/');
  };

  // Refresh profile
  const refreshProfile = async () => {
    if (!state.user) return;

    const userData = await fetchUserData(state.user.id);
    if (userData) {
      userData.email = state.user.email;
      userData.phone = state.user.phone;
    }
    setState(prev => ({ ...prev, user: userData }));
  };

  // Permission check
  const hasPermission = (permission: string): boolean => {
    if (!state.user) return false;

    const profile = state.user.profile;
    if (!profile?.role_id) return false;

    // Super admin has all permissions
    if (state.user.role === 'super_admin') return true;

    // Check role permissions (would need to cache role data)
    const role = profile.role as Role;
    if (!role) return false;

    // Check wildcard permissions
    if (role.permissions.includes('*')) return true;

    // Check specific permission
    return role.permissions.some(p => {
      if (p === permission) return true;
      // Check wildcard patterns like "bookings.*"
      if (p.endsWith('.*')) {
        const prefix = p.slice(0, -2);
        return permission.startsWith(prefix);
      }
      return false;
    });
  };

  // Role check
  const hasRole = (...roles: SystemRole[]): boolean => {
    if (!state.user) return false;
    return roles.includes(state.user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
