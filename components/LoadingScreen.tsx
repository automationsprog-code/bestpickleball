'use client';

import React, { useEffect, useState } from 'react';

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadingOut(true);
      const hideTimer = setTimeout(() => {
        setVisible(false);
      }, 500);
      return () => clearTimeout(hideTimer);
    }, 1300);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center transition-opacity duration-500 selection:bg-lime-500 text-white ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative flex flex-col items-center justify-center space-y-8">
        
        {/* Animated Bouncing Pickleball & Paddle Container */}
        <div className="relative w-52 h-52 flex items-center justify-center">
          
          {/* Radial Backlight Glow */}
          <div className="absolute w-40 h-40 bg-lime-500/20 blur-2xl rounded-full animate-pulse"></div>

          {/* Bouncing Yellow Pickleball */}
          <div className="absolute z-10 animate-pickleball-bounce">
            <div className="w-11 h-11 rounded-full bg-lime-400 border-2 border-lime-300 shadow-[0_0_20px_rgba(163,230,53,0.8)] relative flex items-center justify-center">
              {/* Pickleball Holes */}
              <div className="w-1.5 h-1.5 rounded-full bg-lime-700/60 absolute top-2 left-2"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-lime-700/60 absolute top-2 right-2"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-lime-700/60 absolute bottom-2 left-2.5"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-lime-700/60 absolute bottom-2 right-2.5"></div>
              <div className="w-2 h-2 rounded-full bg-lime-700/70"></div>
            </div>
          </div>

          {/* Pickleball Paddle */}
          <div className="absolute bottom-6 z-0 animate-paddle-tilt">
            <div className="relative flex flex-col items-center">
              {/* Paddle Face */}
              <div className="w-24 h-28 bg-gradient-to-b from-slate-800 to-slate-900 border-4 border-lime-500 rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#a3e635_1px,transparent_1px)] [background-size:8px_8px]"></div>
                <span className="text-[10px] font-black tracking-widest text-lime-400 uppercase z-10">BEST</span>
              </div>
              {/* Paddle Handle */}
              <div className="w-5 h-10 bg-slate-950 border-2 border-slate-700 rounded-b-lg shadow-md -mt-1 relative">
                <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.1)_2px,rgba(255,255,255,0.1)_4px)]"></div>
              </div>
            </div>
          </div>

          {/* Shadow underneath */}
          <div className="absolute bottom-2 w-24 h-2.5 bg-black/60 rounded-full blur-xs animate-pulse"></div>

        </div>

        {/* Brand Header & Loading Status */}
        <div className="text-center space-y-2 relative z-10">
          <div className="flex items-center justify-center space-x-2.5">
            <img src="/logo.jpg" alt="BEST Inc. Logo" className="w-8 h-8 rounded-full border border-lime-400 object-cover shadow-md" />
            <h1 className="text-2xl font-black tracking-tight text-white">
              best<span className="text-lime-400">pickleball</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-bold tracking-wider uppercase animate-pulse">
            Loading Balamban Courts & Live Reservations...
          </p>
        </div>

      </div>

      {/* Keyframe animations */}
      <style jsx>{`
        @keyframes pickleballBounce {
          0%, 100% {
            transform: translateY(-60px) scale(1);
          }
          50% {
            transform: translateY(18px) scale(0.92, 1.08);
          }
        }
        @keyframes paddleTilt {
          0%, 100% {
            transform: rotate(-4deg);
          }
          50% {
            transform: rotate(4deg);
          }
        }
        .animate-pickleball-bounce {
          animation: pickleballBounce 0.55s infinite ease-in-out;
        }
        .animate-paddle-tilt {
          animation: paddleTilt 1.1s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}