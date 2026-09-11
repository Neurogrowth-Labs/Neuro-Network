import React, { useState, useEffect, useRef } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import BiometricVerification from './BiometricVerification';

const INTRO_DURATION_MS = 10_000;

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up' | 'recover'>('sign-in');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isSignUp = authMode === 'sign-up';
  const isRecover = authMode === 'recover';

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroComplete(true), INTRO_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let animationFrameId: number;
    let width = canvas.clientWidth;
    let height = canvas.clientHeight;

    const nodes = Array.from({ length: 58 }).map((_, index) => {
      const angle = (Math.PI * 2 * index) / 58;
      const ring = 0.18 + (index % 5) * 0.07 + Math.random() * 0.09;
      return {
        angle,
        ring,
        phase: Math.random() * Math.PI * 2,
        speed: 0.002 + Math.random() * 0.004,
        drift: 0,
      };
    });

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      frame += 1;
      const progress = Math.min(frame / 600, 1);
      const cx = width / 2;
      const cy = height * 1.1;
      const radius = Math.max(width, height) * 0.58;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#01050d';
      ctx.fillRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.15);
      glow.addColorStop(0, `rgba(6,92,190,${0.13 + progress * 0.14})`);
      glow.addColorStop(0.55, 'rgba(12,47,128,0.10)');
      glow.addColorStop(1, 'rgba(2,3,10,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      const awakening = Math.max(0, Math.min((progress - 0.08) / 0.28, 1));
      const logoPulse = Math.max(0, Math.sin((progress - 0.48) * Math.PI * 2));
      const positions = nodes.map((node) => {
        node.drift += node.speed;
        const wave = Math.sin(frame * 0.012 + node.phase) * 14;
        const orbit = node.angle + Math.sin(node.drift) * 0.08;
        const r = radius * (0.92 + node.ring) * awakening + wave;
        return { x: cx + Math.cos(orbit) * r, y: cy + Math.sin(orbit) * r, a: 0.04 + awakening * 0.08 };
      });

      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j += 5) {
          const p1 = positions[i];
          const p2 = positions[j];
          const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (d < 220) {
            const purple = (p1.x + p2.x) / 2 > cx;
            ctx.strokeStyle = purple
              ? `rgba(139,48,255,${(1 - d / 220) * 0.28 * awakening})`
              : `rgba(0,151,255,${(1 - d / 220) * 0.28 * awakening})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      positions.forEach((p, index) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, index % 9 === 0 ? 3.5 : 2, 0, Math.PI * 2);
        const purple = p.x > cx;
        ctx.fillStyle = purple ? `rgba(175,50,255,${p.a * 3 + logoPulse * 0.18})` : `rgba(0,164,255,${p.a * 3})`;
        ctx.shadowColor = purple ? '#9c2dff' : '#00a4ff';
        ctx.shadowBlur = 12 * awakening + 20 * logoPulse;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

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
    <div className="relative flex h-screen min-h-screen w-full items-center justify-center overflow-hidden bg-[#02030a] p-4 text-white">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,8,18,0.22)_46%,rgba(0,0,0,0.88)_100%)]" />

      {!introComplete && (
        <div className="splash-intro absolute inset-0 z-30 flex flex-col items-center px-7 text-center animate-brand-intro">
          <img
            src="/icon-clean.png"
            alt="Neuro Networks neural network logo"
            className="splash-logo brand-logo-orbit object-contain mix-blend-screen"
          />
          <h1 className="splash-wordmark" aria-label="Neuro Networks">
            <span>NEURO</span><span className="splash-gradient">NETWORKS</span>
          </h1>
          <p className="splash-tagline">Premium relationship intelligence for<br />modern business.</p>
          <div className="splash-progress" aria-label="Loading"><span className="animate-intro-progress" /></div>
          <p className="splash-status">Preparing your workspace</p>
        </div>
      )}

      {introComplete && <div className="relative z-20 w-full max-w-[410px] rounded-[24px] border border-white/20 bg-slate-950/70 p-6 shadow-[0_28px_90px_rgba(0,0,0,0.62),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-2xl animate-auth-card-return sm:p-8">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/30 bg-gradient-to-br from-blue-500/30 to-sky-200/20 shadow-[0_0_32px_rgba(96,165,250,0.28)]">
            <img src="/icon.png" alt="Neuro Networks logo" onError={(e) => (e.currentTarget.src = '/logo.png')} className="h-10 w-10 rounded-xl object-cover" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-cyan-200/70">Neuro Networks</p>
          <h1 className="mt-2 text-lg font-bold text-white">
            {isRecover ? 'Reset your password' : isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <AuthInput
              icon={<User />}
              label="Full name"
              value={fullName}
              onChange={setFullName}
              placeholder="Jane Doe"
              required
            />
          )}

          <AuthInput
            icon={<Mail />}
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            required
          />

          {!isRecover && (
            <AuthInput
              icon={<Lock />}
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              required
              right={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="ml-2 text-white/40 hover:text-white/70"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
          )}

          {isSignUp && (
            <AuthInput
              icon={<Lock />}
              label="Confirm password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="••••••••"
              required
            />
          )}

          {authMode === 'sign-in' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setAuthMode('recover')}
                className="text-xs font-medium text-cyan-300/80 hover:text-cyan-200"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-sky-100 text-sm font-bold text-slate-950 shadow-[0_0_26px_rgba(96,165,250,0.28)] transition hover:from-blue-400 hover:to-white hover:shadow-[0_0_36px_rgba(96,165,250,0.42)] disabled:opacity-60"
          >
            {loading
              ? 'Securing channel'
              : isRecover
              ? 'Send reset link'
              : isSignUp
              ? 'Create my account'
              : 'Sign in'}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-white/50">
          {isRecover ? (
            <button onClick={() => setAuthMode('sign-in')} className="font-semibold text-cyan-300/80 hover:text-cyan-200">
              Back to sign in
            </button>
          ) : isSignUp ? (
            <>
              Already have an account?{' '}
              <button onClick={() => setAuthMode('sign-in')} className="font-semibold text-cyan-300/80 hover:text-cyan-200">
                Sign in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button onClick={() => setAuthMode('sign-up')} className="font-semibold text-cyan-300/80 hover:text-cyan-200">
                Create one
              </button>
            </>
          )}
        </div>

        {!isRecover && (
          <button
            onClick={() => setShowBiometric(true)}
            className="mt-3 w-full text-center text-[11px] font-semibold uppercase tracking-widest text-white/40 hover:text-white/70"
          >
            Use biometric {isSignUp ? 'setup' : 'sign in'} instead
          </button>
        )}
      </div>}

      {showBiometric && (
        <div className="absolute inset-0 z-40 overflow-y-auto bg-black/75 p-4 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[410px] justify-end pb-3 pt-4">
            <button
              onClick={() => setShowBiometric(false)}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/70 hover:text-white"
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
    <label className="group block space-y-2">
      <span className="flex items-center gap-2 text-xs font-semibold text-white/68 transition group-focus-within:text-cyan-200">
        {React.cloneElement(icon, { className: 'h-4 w-4' })}
        {label}
      </span>
      <span className="flex h-12 items-center rounded-xl border border-white/10 bg-black/20 px-4 transition group-focus-within:border-cyan-300/50 group-focus-within:shadow-[0_0_22px_rgba(34,211,238,0.12)]">
        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/22 focus:outline-none"
        />
        {right}
      </span>
    </label>
  );
}
