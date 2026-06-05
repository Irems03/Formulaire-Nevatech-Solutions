/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, Mail, AlertTriangle, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { getSupabase } from '../../../services/supabase';

interface AdminLoginProps {
  onNavigate: (path: string) => void;
  onLoginSuccess: () => void;
}

export default function AdminLogin({ onNavigate, onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabase();

    if (!supabase) {
      setError("Le client Supabase n'est pas configuré. Veuillez définir VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.");
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Handle French translation for typical errors
        if (authError.message.includes('Invalid login credentials')) {
          setError('Identifiants de connexion invalides. Veuillez vérifier votre adresse e-mail ou votre mot de passe.');
        } else {
          setError(authError.message);
        }
      } else {
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Une erreur inconnue est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#E2E8F0] flex flex-col justify-center items-center relative overflow-hidden font-sans px-4">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Back button */}
      <button
        onClick={() => onNavigate('/')}
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors group text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Retour au site
      </button>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3.5 bg-blue-600/10 border border-blue-500/20 rounded-2xl mb-4 text-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.15)] relative group-hover:scale-105 transition-all">
            <Lock className="w-6 h-6 stroke-[2]" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Espace Super-Admin</h2>
          <p className="text-slate-400 text-xs mt-2 font-medium">Nuvatech-Solutions &bull; Client Onboarding Control</p>
        </div>

        {/* Card */}
        <div className="bg-[#0F1218] border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden p-8 relative">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-rose-950/40 border border-rose-800/40 rounded-xl flex items-start gap-3 text-rose-200 text-xs leading-relaxed"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                Adresse Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nuvatech.solutions"
                  className="w-full bg-[#141822] border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-mono"
                />
                <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                Mot de Passe
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#141822] border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-mono"
                />
                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-600" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-[0_4px_20px_rgba(37,99,235,0.25)] hover:shadow-[0_4px_25px_rgba(37,99,235,0.35)] cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  Connexion Securisée
                </>
              )}
            </button>
          </form>
        </div>

        {/* Note on simulation mode if credentials not met */}
        <p className="text-center text-[11px] text-slate-600 mt-6 leading-relaxed">
          Pour configurer vos identifiants administrateur Supabase, créez un compte dans votre tableau de bord Supabase Authentication. Par défaut, la RLS nécessite une session authentifiée pour lire les briefs de projet.
        </p>
      </motion.div>
    </div>
  );
}
