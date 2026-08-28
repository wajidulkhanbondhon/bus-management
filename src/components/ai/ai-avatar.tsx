'use client';

import React from 'react';
import { Sparkles, Bot, Zap, Cpu } from 'lucide-react';

interface AIAvatarProps {
  variant?: 'office' | 'student';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isThinking?: boolean;
  className?: string;
  showStatusBadge?: boolean;
}

export function AIAvatar({
  variant = 'office',
  size = 'md',
  isThinking = false,
  className = '',
  showStatusBadge = true
}: AIAvatarProps) {
  const isOffice = variant === 'office';

  // Size definitions
  const sizeMap = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-sm',
    md: 'w-11 h-11 text-base',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-20 h-20 text-3xl'
  };

  const iconSizeMap = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4.5 h-4.5',
    md: 'w-5.5 h-5.5',
    lg: 'w-7 h-7',
    xl: 'w-10 h-10'
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
      {/* Outer Pulse Halo Ring */}
      <div
        className={`absolute inset-0 rounded-2xl blur-xs opacity-75 transition-all duration-700 ${
          isOffice
            ? 'bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600'
            : 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500'
        } ${isThinking ? 'animate-ping scale-110 opacity-90' : 'animate-pulse'}`}
      />

      {/* Cyber Orbit Ring */}
      <div
        className={`absolute -inset-1 rounded-2xl border border-dashed opacity-50 transition-transform duration-1000 ${
          isOffice ? 'border-indigo-400' : 'border-emerald-400'
        } ${isThinking ? 'animate-spin' : ''}`}
      />

      {/* Main Core 3D Glass Shell */}
      <div
        className={`relative z-10 w-full h-full rounded-2xl flex items-center justify-center overflow-hidden shadow-lg border backdrop-blur-md transition-all duration-300 ${
          isOffice
            ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 border-indigo-500/40 text-cyan-300 shadow-indigo-500/30'
            : 'bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-900 border-emerald-500/40 text-emerald-300 shadow-emerald-500/30'
        }`}
      >
        {/* Core Inner Specular Gloss / Lens Flare */}
        <div className="absolute -top-6 -left-6 w-12 h-12 bg-white/25 rounded-full blur-xs transform rotate-45 pointer-events-none" />

        {/* Futuristic Bot Hologram / Avatar Core Icon */}
        <div className="relative z-20 flex flex-col items-center justify-center">
          {isThinking ? (
            <Sparkles className={`${iconSizeMap[size]} animate-spin-slow text-amber-300`} />
          ) : isOffice ? (
            <div className="relative flex items-center justify-center">
              <Bot className={`${iconSizeMap[size]} transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]`} />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
            </div>
          ) : (
            <div className="relative flex items-center justify-center">
              <Cpu className={`${iconSizeMap[size]} transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]`} />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            </div>
          )}
        </div>

        {/* Dynamic Equalizer Lines for thinking state */}
        {isThinking && (
          <div className="absolute bottom-1 flex gap-0.5 items-end justify-center h-2">
            <div className="w-0.5 bg-cyan-400 animate-[bounce_0.6s_infinite_100ms] h-full" />
            <div className="w-0.5 bg-cyan-300 animate-[bounce_0.6s_infinite_200ms] h-3/4" />
            <div className="w-0.5 bg-cyan-200 animate-[bounce_0.6s_infinite_300ms] h-full" />
          </div>
        )}
      </div>

      {/* Online / Active Badge Indicator */}
      {showStatusBadge && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 z-30 w-3 h-3 rounded-full border-2 border-slate-900 shadow-xs flex items-center justify-center ${
            isOffice ? 'bg-indigo-400' : 'bg-emerald-400'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        </span>
      )}
    </div>
  );
}
