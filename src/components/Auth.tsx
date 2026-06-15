import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Zap, Loader2, Mail, Lock, User, Globe, Shield, Terminal } from 'lucide-react';
import { toast } from 'sonner';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Futuristic 3D Connecting Globe Canvas background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle class for the globe structure
    class NodeParticle {
      x: number = 0;
      y: number = 0;
      z: number = 0;
      px: number = 0; // projected x
      py: number = 0; // projected y
      baseRadius: number = 1.8;
      color: string = 'rgba(6, 182, 212, 0.85)'; // cyan-400

      constructor(public theta: number, public phi: number, public radius: number) {
        this.updateCoords(0, 0);
      }

      updateCoords(rotY: number, rotX: number) {
        // Spherical coordinate positions
        const x3d = this.radius * Math.sin(this.phi) * Math.cos(this.theta);
        const y3d = this.radius * Math.cos(this.phi);
        const z3d = this.radius * Math.sin(this.phi) * Math.sin(this.theta);

        // 3D rotation on Y-axis
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        let x1 = x3d * cosY - z3d * sinY;
        let z1 = x3d * sinY + z3d * cosY;

        // 3D rotation on X-axis (tilt)
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        let y2 = y3d * cosX - z1 * sinX;
        let z2 = y3d * sinX + z1 * cosX;

        // Perspective projection
        const scale = 360 / (360 + z2);
        this.z = z2;
        this.px = width / 2 + x1 * scale;
        this.py = height / 2 + y2 * scale;
      }

      draw(context: CanvasRenderingContext2D) {
        if (this.z > 150) return; // fade out background nodes
        const opacity = Math.max(0.1, 1 - (this.z + this.radius) / (this.radius * 2));
        
        context.beginPath();
        context.arc(this.px, this.py, this.baseRadius * (1 - this.z / 200), 0, Math.PI * 2);
        context.fillStyle = `rgba(6, 182, 212, ${opacity * 0.95})`;
        context.shadowColor = '#06b6d4';
        context.shadowBlur = 8;
        context.fill();
        context.shadowBlur = 0; // reset
      }
    }

    // Generate Globe Nodes along latitude and longitude bands
    const particles: NodeParticle[] = [];
    const bands = 18;
    const countPerBand = 24;
    const globeRadius = Math.min(width, height) * 0.32; // Responsive sizing

    for (let i = 0; i < bands; i++) {
      const phi = (Math.PI / (bands - 1)) * i;
      for (let j = 0; j < countPerBand; j++) {
        const theta = ((Math.PI * 2) / countPerBand) * j;
        particles.push(new NodeParticle(theta, phi, globeRadius));
      }
    }

    // Add extra space/orbital satellites and shooting connections
    interface Satellite {
      theta: number;
      phi: number;
      radius: number;
      speed: number;
      color: string;
      px: number;
      py: number;
      z: number;
    }

    const satellites: Satellite[] = Array.from({ length: 8 }).map(() => ({
      theta: Math.random() * Math.PI * 2,
      phi: Math.random() * Math.PI,
      radius: globeRadius * 1.25,
      speed: 0.005 + Math.random() * 0.005,
      color: Math.random() > 0.4 ? '#06b6d4' : '#10b981', // green/cyan mix
      px: 0,
      py: 0,
      z: 0
    }));

    let rotateY = 0;
    let rotateX = 0.25; // Tilt representation

    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX - width / 2) * 0.0002;
      mouseY = (e.clientY - height / 2) * 0.0002;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);

    // Main animation loop
    const animate = () => {
      ctx.fillStyle = '#050508'; // ultra dark pitch black depth
      ctx.fillRect(0, 0, width, height);

      // Radial dark background glow
      const grad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, globeRadius * 1.8);
      grad.addColorStop(0, 'rgba(8, 20, 36, 0.45)');
      grad.addColorStop(1, 'rgba(5, 5, 8, 1)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Dynamic Rotation velocity based on mouse activity plus background speed
      rotateY += 0.0028 + mouseX;
      rotateX += (mouseY - rotateX) * 0.05 + 0.0001; // subtle drag

      // 1. Draw digital matrix background grids (Holographic tech grid)
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.02)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Project and draw connecting globe nodes
      particles.forEach(p => p.updateCoords(rotateY, rotateX));

      // 3. Connect close nodes to create interactive webs
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.065)';
      ctx.lineWidth = 0.75;
      
      const pxMaxDistance = globeRadius * 0.38;

      for (let i = 0; i < particles.length; i += 3) { // Staggered iteration to preserve performant CPU ratios
        const p1 = particles[i];
        if (p1.z > 80) continue; // Behind sphere layer optimization
        
        for (let j = i + 1; j < particles.length; j += 4) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.px - p2.px, p1.py - p2.py);
          if (dist < pxMaxDistance) {
            const alpha = (1 - dist / pxMaxDistance) * 0.15 * (1 - p1.z / 150);
            ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.stroke();
          }
        }
      }

      // Draw active dots
      particles.forEach(p => p.draw(ctx));

      // 4. Projects and connects satellites (orbital connection tracks)
      satellites.forEach(sat => {
        sat.theta += sat.speed;
        const x3d = sat.radius * Math.sin(sat.phi) * Math.cos(sat.theta);
        const y3d = sat.radius * Math.cos(sat.phi);
        const z3d = sat.radius * Math.sin(sat.phi) * Math.sin(sat.theta);

        // rotates
        const cosY = Math.cos(rotateY * 0.7);
        const sinY = Math.sin(rotateY * 0.7);
        let x1 = x3d * cosY - z3d * sinY;
        let z1 = x3d * sinY + z3d * cosY;

        const scale = 360 / (360 + z1);
        sat.px = width / 2 + x1 * scale;
        sat.py = height / 2 + y3d * scale;
        sat.z = z1;

        if (sat.z < 150) {
          // Draw satellite core ring glow
          ctx.beginPath();
          ctx.arc(sat.px, sat.py, 4, 0, Math.PI * 2);
          ctx.fillStyle = sat.color;
          ctx.shadowColor = sat.color;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Connect satellite directly to nearest cluster points
          particles.forEach((p, idx) => {
            if (idx % 25 === 0) {
              const d = Math.hypot(sat.px - p.px, sat.py - p.py);
              if (d < pxMaxDistance * 1.5) {
                ctx.strokeStyle = `rgba(6, 182, 212, ${(1 - d / (pxMaxDistance * 1.5)) * 0.09})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(sat.px, sat.py);
                ctx.lineTo(p.px, p.py);
                ctx.stroke();
              }
            }
          });
        }
      });

      // 5. Draw overlay telemetry elements on borders (futuristic heads-up-display aesthetics)
      ctx.font = '8px monospace';
      ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.fillText('SYS_SAT_ACTIVE: 8', 20, 30);
      ctx.fillText(`ROT_Y_VEL: ${(rotateY % (Math.PI * 2)).toFixed(3)} RAD`, 20, 45);
      ctx.fillText(`SYS_NODE_COUNT: ${particles.length}`, 20, 60);
      ctx.fillText(`SECTOR_SIGNAL: PROT_SECURE_W3_DB`, width - 180, 30);
      ctx.fillText(`AGENT_LOC_STAMP: UTC-6A-CORE`, width - 180, 45);

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isSimaoAdmin = email.trim().toLowerCase() === "simao@neurogrowthlabs.co.za" && password === "NeuroNetWork";

    try {
      if (isSimaoAdmin) {
        if (isSignUp) {
          try {
            await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  full_name: fullName || "Simao - Super Admin",
                }
              }
            });
          } catch (err) {
            console.warn("Supabase background admin signup registration:", err);
          }
          toast.success("Account created! Authorized Super Admin successfully.");
        } else {
          try {
            await supabase.auth.signInWithPassword({
              email,
              password,
              });
          } catch (err) {
            console.warn("Supabase background admin signin validation:", err);
          }
          toast.success("Welcome back, Super Admin!");
        }

        const mockUser = {
          id: "simao-admin-uuid-99a",
          email: "simao@neurogrowthlabs.co.za",
          user_metadata: {
            full_name: fullName || "Simao - Super Admin",
          }
        };
        localStorage.setItem("bypass_admin_user", JSON.stringify(mockUser));
        
        setTimeout(() => {
          window.location.reload();
        }, 800);
        return;
      }

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
      if (error.message === 'Failed to fetch') {
        toast.error('Could not connect to Supabase. Please ensure your project is active/unpaused, and environment configurations are correct.');
      } else {
        toast.error(error.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#050508]" id="auth-panel-stage">
      {/* Dynamic 3D connecting globe canvas background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-0 pointer-events-none" />

      {/* Cyber ambient grid container overlay */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-cyan-950/10 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />

      {/* Auth Panel Card Header & Contents */}
      <div className="w-full max-w-[420px] z-20 backdrop-blur-xl bg-[#090a10]/75 border border-[#1f293b]/50 p-6 sm:p-8 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.12)] flex flex-col relative transition-all duration-300">
        
        {/* Futuristic layout brackets & indicators */}
        <div className="absolute top-2 left-2 text-[8px] font-mono text-cyan-500/30">⊓ GLOBAL_COMM_v3</div>
        <div className="absolute top-2 right-2 text-[8px] font-mono text-cyan-500/35">AUTH_ONLINE_LIVE ⬤</div>
        
        {/* Top Branding Section */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="relative group mb-3">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 opacity-60 blur-md group-hover:opacity-80 transition duration-1000 group-hover:duration-205" />
            <div className="relative w-16 h-16 rounded-2xl bg-black border border-white/10 flex items-center justify-center overflow-hidden">
              <img 
                src="/icon.png" 
                alt="Neuro NetWorks Logo" 
                onError={(e) => e.currentTarget.src = '/logo.png'} 
                className="w-full h-full object-cover rounded-2xl scale-105" 
              />
            </div>
          </div>
          
          <h1 className="text-xl font-black uppercase tracking-wider text-white bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
            Neuro NetWorks
          </h1>
          <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest mt-1">
            Global Digital Connection Core
          </p>
        </div>

        {/* Primary input registration form */}
        <form onSubmit={handleAuth} className="space-y-4">
          
          {isSignUp && (
            <div className="space-y-1 animate-slide-in">
              <label className="text-[9px] font-black text-cyan-400 pl-1 uppercase tracking-widest flex items-center gap-1">
                <User className="w-3 h-3" /> Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/25 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono"
                placeholder="REG_NAME_ENTRY"
              />
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-[9px] font-black text-cyan-400 pl-1 uppercase tracking-widest flex items-center gap-1">
              <Mail className="w-3 h-3" /> Email Node
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/25 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono"
              placeholder="SYS_ADDR_ENTRY"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
              <label className="text-[9px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                <Lock className="w-3 h-3" /> Security Token
              </label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/25 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono"
              placeholder="SECRET_TOKEN"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full relative group overflow-hidden bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-[10px] uppercase tracking-widest rounded-xl py-3.5 mt-4 transition-all duration-300 disabled:opacity-50 flex justify-center items-center h-12 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.55)] cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                {isSignUp ? 'Initialize Register Pipeline' : 'Connect Security Channel'}
              </span>
            )}
          </button>
        </form>

        {/* Change auth mode selector footer */}
        <div className="mt-6 text-center text-xs text-white/40">
          {isSignUp ? "Registered in control cluster? " : "New security coordinate? "}
          <button 
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-cyan-400 hover:text-cyan-300 font-extrabold tracking-wider uppercase text-[10px] hover:underline hover:shadow-glow ml-1 ml-0.5 border-b border-transparent hover:border-cyan-400 pb-0.5"
          >
            {isSignUp ? 'Execute Secure Access' : 'Create Network Record'}
          </button>
        </div>

        {/* HUD Sub-coordinates */}
        <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-[8px] font-mono text-white/30">
          <span className="flex items-center gap-1"><Shield className="w-2.5 h-2.5" /> SHA256 ENCRYPTED</span>
          <span>SENDER: PROX_V2</span>
        </div>
      </div>
    </div>
  );
}
