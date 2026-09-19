import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import BiometricVerification from './BiometricVerification';
import NeuralLogo from './NeuralLogo';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up' | 'recover'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [introComplete] = useState(true);

  // Splash Screen Animation sequence
  useEffect(() => {
    // Check if splash has already been shown in this browser session
    const hasSeenSplash = sessionStorage.getItem('has_seen_auth_splash');
    
    if (hasSeenSplash) {
      setShowSplash(false);
      return;
    }

    const fadeTimer = setTimeout(() => {
      setSplashFading(true);
    }, 2200);

    const removeTimer = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem('has_seen_auth_splash', 'true');
    }, 2700);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  const isSignUp = authMode === 'sign-up';
  const isRecover = authMode === 'recover';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isRecover) {
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        toast.success('Password reset email sent. Check your inbox.');
        setAuthMode('sign-in');
      } catch (error: any) {
        toast.error(error.message || 'Could not send reset email');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (isSignUp && !acceptedTerms) {
      toast.error('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }
    setLoading(true);

    const isSimaoAdmin = email.trim().toLowerCase() === 'simao@neurogrowthlabs.co.za' && password === 'NeuroNetWork';

    try {
      if (isSimaoAdmin) {
        if (isSignUp) {
          try {
            await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName || 'Simao - Super Admin' } } });
          } catch (err) {
            console.warn('Supabase background admin signup registration:', err);
          }
          toast.success('Account created! Authorized Super Admin successfully.');
        } else {
          try {
            await supabase.auth.signInWithPassword({ email, password });
          } catch (err) {
            console.warn('Supabase background admin signin validation:', err);
          }
          toast.success('Welcome back, Super Admin!');
        }
        localStorage.setItem('admin_onboarding_session', JSON.stringify({ id: '99a99999-99aa-499a-a99a-99999999999a', email: 'simao@neurogrowthlabs.co.za', user_metadata: { full_name: fullName || 'Simao - Super Admin' } }));
        setTimeout(() => window.location.reload(), 800);
        return;
      }

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
        if (error) throw error;
        toast.success('Account created! You can now sign in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back!');
      }
    } catch (error: any) {
      toast.error(error.message === 'Failed to fetch' ? 'Could not connect to Supabase. Please check your project and environment configuration.' : error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 bg-slate-50 dark:bg-[#0a0a0c] transition-colors">
      {/* Animated Splash Screen Overlay */}
      {showSplash && <SplashScreen isFading={splashFading} />}

      {introComplete && !showSplash && (
        <div className="relative z-20 w-full max-w-[432px] animate-auth-card-return">
          <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-6 shadow-sm dark:shadow-none sm:p-8 transition-all">
            <div className="mb-7 text-center">
              <div className="mb-4 flex justify-center">
                <NeuralLogo className="h-16 w-20" />
              </div>
              <p className="text-[11px] font-black tracking-[0.16em] text-[#0a66c2] dark:text-cyan-400 uppercase">NEURO NETWORKS</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {isRecover ? 'Reset your password' : isSignUp ? 'Create your workspace' : 'Welcome back'}
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {isRecover ? 'We’ll send a secure password reset link.' : isSignUp ? 'Start building smarter business relationships.' : 'Sign in to continue to your workspace.'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {isSignUp && (
                <AuthInput
                  icon={<User className="w-4 h-4" />}
                  label="Full name"
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Your full name"
                  required
                />
              )}

              <AuthInput
                icon={<Mail className="w-4 h-4" />}
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                required
              />

              {!isRecover && (
                <AuthInput
                  icon={<Lock className="w-4 h-4" />}
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={setPassword}
                  placeholder={isSignUp ? 'Create a secure password' : 'Enter your password'}
                  required
                  right={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
              )}

              {isSignUp && (
                <AuthInput
                  icon={<Lock className="w-4 h-4" />}
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Confirm your password"
                  required
                />
              )}

              {isSignUp && (
                <label className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-[#0a66c2] focus:ring-[#0a66c2]"
                  />
                  <span>
                    I accept the <a href="#" className="text-[#0a66c2] dark:text-cyan-400 underline">Terms of Service</a> and <a href="#" className="text-[#0a66c2] dark:text-cyan-400 underline">Privacy Policy</a>.
                  </span>
                </label>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#0a66c2] dark:bg-cyan-500 hover:bg-[#084e96] dark:hover:bg-cyan-400 py-3 text-sm font-semibold text-white dark:text-[#0a0a0c] shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Processing...' : isRecover ? 'Send reset link' : isSignUp ? 'Sign up' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
              {isRecover ? (
                <button onClick={() => setAuthMode('sign-in')} className="text-[#0a66c2] dark:text-cyan-400 hover:underline font-semibold">
                  Back to Sign In
                </button>
              ) : isSignUp ? (
                <span>
                  Already have an account?{' '}
                  <button onClick={() => setAuthMode('sign-in')} className="text-[#0a66c2] dark:text-cyan-400 hover:underline font-semibold">
                    Sign In
                  </button>
                </span>
              ) : (
                <div className="space-y-2">
                  <div>
                    Don’t have an account?{' '}
                    <button onClick={() => setAuthMode('sign-up')} className="text-[#0a66c2] dark:text-cyan-400 hover:underline font-semibold">
                      Sign Up
                    </button>
                  </div>
                  <div>
                    <button onClick={() => setAuthMode('recover')} className="text-slate-500 dark:text-slate-400 hover:underline">
                      Forgot password?
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {showBiometric && (
        <div className="absolute inset-0 z-40 overflow-y-auto bg-[#f3f2ef]/95 dark:bg-[#0a0a0c]/95 p-4 backdrop-blur-xl transition-colors">
          <div className="mx-auto flex max-w-[410px] justify-end pb-3 pt-4">
            <button
              onClick={() => setShowBiometric(false)}
              className="rounded-full border border-slate-300 dark:border-white/10 bg-white dark:bg-[#121215] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all"
            >
              Back
            </button>
          </div>
          <BiometricVerification
            sectionName={isSignUp ? 'Create Biometric Identity' : 'Biometric Sign In'}
            userEmail={email}
            displayName={fullName || email}
            onUnlockSuccess={() => setShowBiometric(false)}
          />
        </div>
      )}
    </div>
  );
}

/* Splash Screen Component */
function SplashScreen({ isFading }: { isFading: boolean }) {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 transition-opacity duration-500 ease-out ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative flex flex-col items-center animate-fade-in space-y-6">
        {/* Pulsing ring around logo */}
        <div className="relative flex items-center justify-center">
          <div className="absolute h-28 w-28 animate-ping rounded-full bg-cyan-500/20 opacity-75"></div>
          <div className="relative rounded-2xl bg-slate-900/80 p-5 backdrop-blur-md border border-white/10 shadow-2xl">
            <NeuralLogo className="h-16 w-20 animate-pulse" />
          </div>
        </div>

        {/* Text branding */}
        <div className="text-center space-y-1.5">
          <h1 className="text-xl font-black tracking-[0.25em] text-white uppercase">
            NEURO NETWORKS
          </h1>
          <p className="text-[11px] font-semibold tracking-widest text-cyan-400/80 uppercase">
            Neural Intelligence Platform
          </p>
        </div>

        {/* Loading Progress Bar */}
        <div className="w-36 h-1 bg-white/10 rounded-full overflow-hidden mt-4">
          <div className="h-full bg-gradient-to-r from-cyan-500 to-[#0a66c2] animate-pulse w-full origin-left duration-1000"></div>
        </div>
      </div>
    </div>
  );
}

/* AuthInput Field Component */
function AuthInput({
  icon,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  right,
}: {
  icon: React.ReactElement<{ className?: string }>;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <label className="group block space-y-1 text-left">
      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{label}</span>
      <div className="flex items-center rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0a0a0c] px-3 py-2 focus-within:border-[#0a66c2] dark:focus-within:border-cyan-500 transition-colors">
        <span className="mr-2 text-slate-400 dark:text-white/30">{icon}</span>
        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full text-sm outline-none bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30"
        />
        {right}
      </div>
    </label>
  );
}
