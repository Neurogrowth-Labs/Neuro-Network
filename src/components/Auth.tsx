import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });
        if (error) throw error;
        toast.success("Account created! You can now sign in.");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0c] p-6 relative">
      <div className="absolute inset-0 bg-cyan-500/5 blur-[100px] pointer-events-none" />
      
      <div className="mb-8 flex flex-col items-center">
        <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4 border border-cyan-500/30">
          <Zap className="w-6 h-6 text-cyan-400" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Neuro NetWorks</h1>
        <p className="text-white/50 text-sm mt-2 font-medium">Connect and manage your network.</p>
      </div>

      <form onSubmit={handleAuth} className="w-full max-w-sm space-y-4">
        {isSignUp && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-widest pl-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-[#12121a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition-colors"
              placeholder="John Doe"
            />
          </div>
        )}
        
        <div className="space-y-1">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-widest pl-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#12121a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition-colors"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-white/50 uppercase tracking-widest pl-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#12121a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition-colors"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-cyan-500 text-black font-bold rounded-xl py-3 mt-4 hover:bg-cyan-400 transition-colors disabled:opacity-50 flex justify-center items-center h-12"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? 'Create Account' : 'Sign In')}
        </button>
      </form>

      <div className="mt-6 text-sm text-white/50">
        {isSignUp ? "Already have an account? " : "Don't have an account? "}
        <button 
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-cyan-400 hover:text-cyan-300 font-medium ml-1"
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </div>
    </div>
  );
}
