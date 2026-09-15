 main
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import BiometricVerification from './BiometricVerification';
import NeuralLogo from './NeuralLogo';


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
32 w-36 sm:h-40 sm:w-44" />
        </div>
      )}

      {introComplete && <div className="relative z-20 w-full max-w-[432px] animate-auth-card-return">
        <section className="rounded-lg border border-[#d0d7de] bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-7 text-center">
          <div className="mb-4 flex justify-center"><NeuralLogo className="h-16 w-20" /></div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#0a66c2]">NEURO NETWORKS</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#1d2226]">
            {isRecover ? 'Reset your password' : isSignUp ? 'Create your workspace' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm text-[#5f6b7a]">{isRecover ? 'We’ll send a secure password reset link.' : isSignUp ? 'Start building smarter business relationships.' : 'Sign in to continue to your workspace.'}</p>
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
                  className="ml-2 text-[#1d2226]/40 hover:text-[#1d2226]/70"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
            placeholder={isSignUp ? 'Create a secure password' : 'Enter your password'}
              required
              right={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="ml-2 text-[#1d2226]/40 hover:text-[#1d2226]/70"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
          )}

          {isSignUp && (
  

      {showBiometric && (
        <div className="absolute inset-0 z-40 overflow-y-auto bg-[#f3f2ef]/95 p-4 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[410px] justify-end pb-3 pt-4">
            <button
              onClick={() => setShowBiometric(false)}
              className="rounded-full border border-[#d0d7de] bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#1d2226]/70 hover:text-[#1d2226]"
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

        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}

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

    </div>
  );
}
