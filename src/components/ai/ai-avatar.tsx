'use client';

import React from 'react';
import { Sparkles, Bot, Cpu, Zap } from 'lucide-react';

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
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  const svgSizeMap = {
    xs: 18,
    sm: 22,
    md: 28,
    lg: 36,
    xl: 52
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
      {/* Outer Pulse Glow Halo */}
      <div
        className={`absolute -inset-0.5 rounded-2xl blur-xs opacity-70 transition-all duration-700 ${
          isOffice
            ? 'bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-500 dark:via-indigo-500 dark:to-cyan-400'
            : 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-600 dark:from-emerald-500 dark:via-teal-400 dark:to-cyan-300'
        } ${isThinking ? 'animate-ping scale-110 opacity-90' : 'animate-pulse'}`}
      />

      {/* Cyber Orbit Dashed Ring */}
      <div
        className={`absolute -inset-1 rounded-2xl border border-dashed opacity-40 transition-transform duration-1000 ${
          isOffice ? 'border-indigo-500 dark:border-indigo-400' : 'border-emerald-500 dark:border-emerald-400'
        } ${isThinking ? 'animate-spin' : ''}`}
      />

      {/* Main Glass Core Shell (Supports Light & Dark Modes) */}
      <div
        className={`relative z-10 w-full h-full rounded-2xl flex items-center justify-center overflow-hidden border shadow-md backdrop-blur-md transition-all duration-300 ${
          isOffice
            ? 'bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 border-indigo-200 dark:border-indigo-500/40 text-indigo-600 dark:text-cyan-300 shadow-indigo-500/15 dark:shadow-indigo-500/30'
            : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-900 dark:via-emerald-950 dark:to-slate-900 border-emerald-200 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-300 shadow-emerald-500/15 dark:shadow-emerald-500/30'
        }`}
      >
        {/* Specular Inner Highlight */}
        <div className="absolute -top-4 -left-4 w-8 h-8 bg-white/40 dark:bg-white/20 rounded-full blur-xs pointer-events-none" />

        {/* Futuristic Custom Vector AI Neural Core Logo */}
        <div className="relative z-20 flex items-center justify-center">
          {isThinking ? (
            <Sparkles className="animate-spin-slow text-amber-500 dark:text-amber-300" style={{ width: svgSizeMap[size], height: svgSizeMap[size] }} />
          ) : isOffice ? (
            <svg
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: svgSizeMap[size], height: svgSizeMap[size] }}
              className="drop-shadow-xs"
            >
              <defs>
                <linearGradient id="officeAiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="50%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
              {/* Futuristic Hexagonal Neuro Shield */}
              <path
                d="M16 3L27 9.5V22.5L16 29L5 22.5V9.5L16 3Z"
                fill="url(#officeAiGrad)"
                fillOpacity="0.15"
                stroke="url(#officeAiGrad)"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              {/* Internal Quantum Nodes & Eye Core */}
              <circle cx="16" cy="16" r="3.5" fill="url(#officeAiGrad)" />
              <circle cx="16" cy="16" r="1.5" fill="#FFFFFF" />
              <path d="M16 7V12.5M16 19.5V25M8 11.5L12.5 14M19.5 18L24 20.5M24 11.5L19.5 14M12.5 18L8 20.5" stroke="url(#officeAiGrad)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: svgSizeMap[size], height: svgSizeMap[size] }}
              className="drop-shadow-xs"
            >
              <defs>
                <linearGradient id="studentAiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="50%" stopColor="#14B8A6" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
              {/* Smart Transport & Graduation Neuro Spark */}
              <path
                d="M16 4L28 10L16 16L4 10L16 4Z"
                fill="url(#studentAiGrad)"
                fillOpacity="0.25"
                stroke="url(#studentAiGrad)"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <path
                d="M8 12.5V20.5C8 23.5 11.5 27 16 27C20.5 27 24 23.5 24 20.5V12.5"
                stroke="url(#studentAiGrad)"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
              {/* Central Glowing Spark */}
              <circle cx="16" cy="19.5" r="2.5" fill="url(#studentAiGrad)" />
              <circle cx="16" cy="19.5" r="1" fill="#FFFFFF" />
            </svg>
          )}
        </div>
      </div>

      {/* Live Online / Pulse Node Badge */}
      {showStatusBadge && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 z-30 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 shadow-xs flex items-center justify-center ${
            isOffice ? 'bg-indigo-500 dark:bg-indigo-400' : 'bg-emerald-500 dark:bg-emerald-400'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        </span>
      )}
    </div>
  );
}
