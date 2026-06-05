/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getSupabase } from '../services/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();

    if (!supabase) {
      // In local preview simulation mode (when Supabase env variables are not specified),
      // we allow access so the user can easily view the Admin Dashboard mockup in AI Studio.
      console.warn("Supabase env vars are missing. Authorizing dashboard access in local preview mode.");
      setIsAuthenticated(true);
      setLoading(false);
      return;
    }

    // Single query getSession checks existing cookie/storage session
    const checkUserSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session fetch error:", error);
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(!!session);
        }
      } catch (err) {
        console.error("Unhandled auth retrieval error:", err);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();

    // Listen to real-time auth changes (e.g. timeout, logout elsewhere)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0C10] text-[#E2E8F0] flex flex-col justify-center items-center">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 relative" />
        </div>
        <p className="text-slate-500 text-xs mt-4 font-semibold tracking-wider uppercase font-mono">Vérification de sécurité...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
