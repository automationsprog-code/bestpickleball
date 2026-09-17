'use client';

import React, { useState } from 'react';
import { Laptop, Tablet, Smartphone, Maximize2, RotateCw, CheckCircle2, ShieldCheck, Database, Layers } from 'lucide-react';
import { ViewportMode } from '@/lib/types';

interface DeviceSimulatorProps {
  children: React.ReactNode;
}

export default function DeviceSimulator({ children }: DeviceSimulatorProps) {
  const [mode, setMode] = useState<ViewportMode>('responsive');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [zoom, setZoom] = useState<number>(100);

  // Resolution dimensions
  const getDimensions = () => {
    switch (mode) {
      case 'desktop':
        return { width: 1440, height: 900, name: 'Desktop / PC', pxLabel: '1440px × 900px' };
      case 'tablet':
        return orientation === 'portrait' 
          ? { width: 768, height: 1024, name: 'Tablet (Portrait)', pxLabel: '768px × 1024px' }
          : { width: 1024, height: 768, name: 'Tablet (Landscape)', pxLabel: '1024px × 768px' };
      case 'mobile':
        return orientation === 'portrait' 
          ? { width: 375, height: 812, name: 'Mobile (iPhone 14)', pxLabel: '375px × 812px' }
          : { width: 812, height: 375, name: 'Mobile (Landscape)', pxLabel: '812px × 375px' };
      case 'responsive':
      default:
        return { width: '100%', height: '100%', name: 'Full Responsive Screen', pxLabel: 'Fluid Screen (100%)' };
    }
  };

  const current = getDimensions();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-lime-500 selection:text-slate-950">
      {/* Top Device Switcher Toolbar */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Brand & Badge */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-lime-500 text-slate-950 font-black text-lg shadow-md shadow-lime-500/20">
              B
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                Balamban Pickleball Booking
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-lime-500/10 text-lime-400 border border-lime-500/20">
                  <CheckCircle2 className="w-3 h-3 text-lime-400" /> BEST Inc.
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">Balamban, Cebu • Multi-Device Viewport Inspector</p>
            </div>
          </div>

          {/* Viewport Selectors with PX Labels */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner space-x-1">
            <button
              onClick={() => setMode('responsive')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'responsive' 
                  ? 'bg-lime-500 text-slate-950 shadow-md font-bold' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
              title="Full Responsive Fluid View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Screen</span>
            </button>

            <button
              onClick={() => setMode('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'desktop' 
                  ? 'bg-lime-500 text-slate-950 shadow-md font-bold' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
              title="Desktop Viewport 1440px"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>PC (1440px)</span>
            </button>

            <button
              onClick={() => setMode('tablet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'tablet' 
                  ? 'bg-lime-500 text-slate-950 shadow-md font-bold' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
              title="Tablet Viewport 768px"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>Tablet (768px)</span>
            </button>

            <button
              onClick={() => setMode('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'mobile' 
                  ? 'bg-lime-500 text-slate-950 shadow-md font-bold' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
              title="Mobile Viewport 375px"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile (375px)</span>
            </button>
          </div>

          {/* Dimension Indicator Pill & Controls */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-950 border border-lime-500/30 text-lime-400 text-xs font-mono font-medium shadow-sm">
              <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></span>
              <span>{current.pxLabel}</span>
            </div>

            {(mode === 'mobile' || mode === 'tablet') && (
              <button
                onClick={() => setOrientation(o => o === 'portrait' ? 'landscape' : 'portrait')}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                title="Rotate Screen Orientation"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            )}

            {mode !== 'responsive' && (
              <div className="flex items-center space-x-1 text-xs text-slate-400 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
                <span>Zoom:</span>
                <select 
                  value={zoom} 
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="bg-transparent text-white font-mono focus:outline-none cursor-pointer"
                >
                  <option value={100} className="bg-slate-900">100%</option>
                  <option value={85} className="bg-slate-900">85%</option>
                  <option value={75} className="bg-slate-900">75%</option>
                </select>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Main Viewport Container */}
      <main className="flex-1 bg-slate-950 overflow-auto py-6 px-2 sm:px-4 flex justify-center items-start">
        {mode === 'responsive' ? (
          <div className="w-full max-w-7xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden min-h-[85vh]">
            {children}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Active Device Label Badge */}
            <div className="mb-3 flex items-center space-x-2 bg-slate-900 px-4 py-1.5 rounded-full border border-slate-800 text-slate-300 text-xs font-semibold shadow-md">
              <Layers className="w-3.5 h-3.5 text-lime-400" />
              <span>Simulated Device View: <strong className="text-white">{current.name}</strong> ({current.pxLabel})</span>
            </div>

            {/* Device Mockup Frame */}
            <div 
              style={{
                width: typeof current.width === 'number' ? `${current.width}px` : current.width,
                height: typeof current.height === 'number' ? `${current.height}px` : current.height,
                transform: zoom !== 100 ? `scale(${zoom / 100})` : 'none',
                transformOrigin: 'top center',
              }}
              className={`bg-slate-900 rounded-3xl border-8 border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col transition-all duration-300 relative ${
                mode === 'mobile' ? 'rounded-[40px] border-[12px] border-slate-800 shadow-lime-900/10' : ''
              }`}
            >
              {/* Mobile Notch Indicator */}
              {mode === 'mobile' && (
                <div className="w-32 h-4 bg-slate-800 rounded-b-xl absolute top-0 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-slate-950 border border-slate-700"></div>
                </div>
              )}

              {/* Internal Scrollable App Container */}
              <div className="flex-1 overflow-y-auto w-full bg-slate-900 text-slate-100">
                {children}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Info Pill */}
      <footer className="bg-slate-950 border-t border-slate-900 py-2 text-center text-slate-500 text-[11px] flex items-center justify-center space-x-4">
        <span>📍 Balamban Extensive Skills and Technology, Inc., Balamban, Cebu</span>
        <span>•</span>
        <span className="flex items-center gap-1 text-lime-400/80">
          <Database className="w-3 h-3" /> Supabase & Vercel Ready
        </span>
      </footer>
    </div>
  );
}
