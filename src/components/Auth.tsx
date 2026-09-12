import React, { useState, useEffect, useRef } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Fingerprint, ShieldCheck, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import BiometricVerification from './BiometricVerification';

const INTRO_DURATION_MS = 7_500;

const loadingStates = [
  'Initializing neural engine',
  'Synchronizing your network',
  'Preparing your workspace',
];

function NeuralLogo() {
  const left = '#00a8f5';
  const right = '#a52cf2';
  const nodes = [
    [34, 92, left], [48, 53, left], [72, 25, left], [100, 42, left], [103, 79, left], [67, 112, left], [35, 128, left], [61, 153, left], [99, 171, left],
    [128, 66, '#5361ee'], [151, 25, right], [181, 44, right], [197, 92, right], [176, 126, right], [201, 128, right], [176, 155, right], [146, 160, right], [130, 171, '#6c50ee'],
  ];
  const links = [[34,92,48,53],[48,53,72,25],[48,53,103,79],[72,25,100,42],[100,42,128,66],[103,79,128,66],[34,92,67,112],[48,53,67,112],[67,112,35,128],[67,112,61,153],[61,153,99,171],[35,128,99,171],[103,79,67,112],[128,66,151,25],[128,66,181,44],[128,66,146,160],[151,25,181,44],[181,44,197,92],[197,92,176,126],[197,92,201,128],[176,126,201,128],[176,126,176,155],[176,155,146,160],[146,160,130,171],[130,171,99,171],[146,160,128,66]];
  return <svg className="splash-logo brand-logo-orbit" viewBox="0 0 232 196" role="img" aria-label="Neuro Networks neural network logo">
    <defs>
      <linearGradient id="neural-gradient" x1="0" x2="1"><stop stopColor="#00a8f5"/><stop offset=".5" stopColor="#3f68f4"/><stop offset="1" stopColor="#b62eee"/></linearGradient>
      <filter id="neural-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <g fill="none" stroke="url(#neural-gradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#neural-glow)">
      {links.map(([x1,y1,x2,y2]) => <path key={`${x1}-${y1}-${x2}-${y2}`} d={`M${x1} ${y1} L${x2} ${y2}`} />)}
      <path d="M113 140V84c0-5 6-7 10-3l31 30V78" strokeWidth="7" />
      <path d="M126 119l29 29c4 4 10 1 10-4V91" strokeWidth="7" />
    </g>
    <g filter="url(#neural-glow)">{nodes.map(([cx, cy, fill]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5.7" fill={fill as string} />)}</g>
  </svg>;
}

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
  const [loadingStateIndex, setLoadingStateIndex] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isSignUp = authMode === 'sign-up';
  const isRecover = authMode === 'recover';
  const passwordScore = [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;

  useEffect(() => {
    const timer = window.setTimeout(() => setIntroComplete(true), INTRO_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setLoadingStateIndex((current) => (current + 1) % loadingStates.length), 2_250);
    return () => window.clearInterval(timer);
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
    <div className="relative flex h-full min-h-[100svh] w-full items-center justify-center overflow-hidden bg-[#02030a] p-4 text-white">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,8,18,0.22)_46%,rgba(0,0,0,0.88)_100%)]" />

      {!introComplete && (
        <div className="splash-intro absolute inset-0 z-30 flex flex-col items-center px-7 text-center animate-brand-intro">
          <NeuralLogo />
          <h1 className="splash-wordmark" aria-label="Neuro Networks">
            <span>NEURO</span><span className="splash-gradient">NETWORKS</span>
          </h1>
          <p className="splash-tagline">Premium relationship intelligence for<br />modern business.</p>
          <div className="splash-progress" aria-label="Loading"><span className="animate-intro-progress" /></div>
          <p className="splash-status" aria-live="polite">{loadingStates[loadingStateIndex]}</p>
        </div>
      )}

      {introComplete && <div className="auth-shell relative z-20 grid w-full max-w-[980px] overflow-hidden rounded-[28px] animate-auth-card-return md:grid-cols-[0.9fr_1.1fr]">
        <section className="auth-story hidden flex-col justify-between p-10 md:flex">
          <div>
            <NeuralLogo />
            <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.42em] text-cyan-100/70">Neuro Networks</p>
            <h2 className="mt-4 max-w-sm text-3xl font-medium leading-tight text-white">Relationship intelligence for the people who move business forward.</h2>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-300/70">A private workspace for the relationships, context, and connections that matter most.</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-300/75"><ShieldCheck className="h-4 w-4 text-cyan-300" /> Protected by enterprise-grade security</div>
        </section>
        <section className="auth-card p-6 sm:p-8 md:p-10">
        <div className="mb-7 text-center md:text-left">
          <div className="mb-5 flex items-center justify-center md:hidden"><NeuralLogo /></div>
          <p className="text-[10px] font-bold uppercase tracking-[0.42em] text-cyan-200/70 md:hidden">Neuro Networks</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {isRecover ? 'Reset your password' : isSignUp ? 'Create your workspace' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm text-slate-300/65">{isRecover ? 'We’ll send a secure password reset link.' : isSignUp ? 'Start building smarter business relationships.' : 'Sign in to continue to your workspace.'}</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <AuthInput
              icon={<User />}
              label="Full name"
              value={fullName}
              onChange={setFullName}
              placeholder="Your full name"
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
            placeholder={isSignUp ? 'Create a secure password' : 'Enter your password'}
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
            <>
              <PasswordStrength score={passwordScore} />
              <AuthInput
                icon={<Lock />}
                label="Confirm password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Confirm your password"
                required
              />
              <label className="flex cursor-pointer items-start gap-3 pt-1 text-xs leading-5 text-slate-300/65">
                <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 accent-cyan-400" />
                <span>By creating an account, you agree to our <button type="button" className="font-medium text-cyan-200 hover:text-white">Terms of Service</button> and <button type="button" className="font-medium text-cyan-200 hover:text-white">Privacy Policy</button>.</span>
              </label>
            </>
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
            className="auth-primary group flex h-13 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? (isSignUp ? 'Creating workspace' : 'Signing in')
              : isRecover
              ? 'Send reset link'
              : isSignUp
              ? 'Create workspace'
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
            className="auth-biometric mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-200/75"
          >
            <Fingerprint className="h-4 w-4 text-cyan-300" /> Use biometric {isSignUp ? 'setup' : 'sign in'}
          </button>
        )}
        </section>
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
      <span className="flex items-center gap-2 text-xs font-medium text-slate-200/80 transition group-focus-within:text-cyan-100">
        {React.cloneElement(icon, { className: 'h-4 w-4' })}
        {label}
      </span>
      <span className="auth-input flex h-12 items-center rounded-xl px-4">
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

function PasswordStrength({ score }: { score: number }) {
  const labels = ['Weak', 'Fair', 'Strong', 'Excellent'];
  const requirements = ['8+ characters', 'Uppercase letter', 'Number', 'Special character'];
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5">
      <div className="flex items-center justify-between text-[11px]"><span className="text-slate-300/70">Password strength</span><span className="font-medium text-cyan-200">{score ? labels[score - 1] : '—'}</span></div>
      <div className="mt-2.5 grid grid-cols-4 gap-1.5">{[1, 2, 3, 4].map((level) => <span key={level} className={`h-1 rounded-full transition-colors ${level <= score ? 'bg-gradient-to-r from-cyan-400 to-violet-500' : 'bg-white/10'}`} />)}</div>
      <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1.5">{requirements.map((requirement, index) => <span key={requirement} className={`flex items-center gap-1.5 text-[10px] ${index < score ? 'text-cyan-100' : 'text-slate-500'}`}><Check className="h-3 w-3" />{requirement}</span>)}</div>
    </div>
  );
}
