'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

export interface AILogoProps {
  variant?: 'office' | 'student' | 'supervisor';
  size?: number | string;
  className?: string;
}

/**
 * ATOMS Transport AI - Unique Bespoke Brand Identity
 * Concept: Quantum Mobility Node & Atomic Route Prism
 * Features 3 interlocking speed velocity orbits, an intelligent central hexagonal core,
 * and 4 cardinal GPS routing nodes representing express university transit.
 */
export function AILogo({
  variant = 'office',
  size = 28,
  className = '',
}: AILogoProps) {
  const isOffice = variant === 'office';
  const isSupervisor = variant === 'supervisor';
  const width = typeof size === 'number' ? `${size}px` : size;
  const height = width;

  const orbit1Stroke = isOffice
    ? 'url(#atomsOrbitGrad1)'
    : isSupervisor
    ? 'url(#supervisorOrbitGrad1)'
    : 'url(#studentAtomsOrbit1)';

  const orbit2Stroke = isOffice
    ? 'url(#atomsOrbitGrad2)'
    : isSupervisor
    ? 'url(#supervisorOrbitGrad2)'
    : 'url(#studentAtomsOrbit2)';

  const coreFill = isOffice
    ? 'url(#atomsCoreGrad)'
    : isSupervisor
    ? 'url(#supervisorCoreGrad)'
    : 'url(#studentAtomsCoreGrad)';

  const glowFill = isOffice
    ? 'url(#atomsCoreGlow)'
    : isSupervisor
    ? 'url(#supervisorGlow)'
    : 'url(#studentAtomsGlow)';

  const coreStroke = isOffice ? '#818CF8' : isSupervisor ? '#FBBF24' : '#34D399';

  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width, height, minWidth: width, minHeight: height }}
      className={`shrink-0 drop-shadow-sm transition-transform ${className}`}
    >
      <defs>
        {/* Office Theme Gradients: Electric Cobalt, Hyper Indigo, Violet Pulse */}
        <linearGradient id="atomsOrbitGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#9333EA" />
        </linearGradient>

        <linearGradient id="atomsOrbitGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>

        <linearGradient id="atomsCoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>

        <radialGradient id="atomsCoreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
        </radialGradient>

        {/* Student Theme Gradients: Neon Emerald, Bright Teal, Cyber Cyan */}
        <linearGradient id="studentAtomsOrbit1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="50%" stopColor="#0D9488" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        <linearGradient id="studentAtomsOrbit2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>

        <linearGradient id="studentAtomsCoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A7F3D0" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>

        <radialGradient id="studentAtomsGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#0D9488" stopOpacity="0" />
        </radialGradient>

        {/* Supervisor Theme Gradients: Warm Amber, Golden Sunburst, Vibrant Orange */}
        <linearGradient id="supervisorOrbitGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>

        <linearGradient id="supervisorOrbitGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#C2410C" />
        </linearGradient>

        <linearGradient id="supervisorCoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>

        <radialGradient id="supervisorGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#EA580C" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ═══ 1. OUTER VELOCITY ORBIT 1 (60 deg tilt) ═══ */}
      <ellipse
        cx="18"
        cy="18"
        rx="15"
        ry="6.5"
        transform="rotate(-30 18 18)"
        stroke={orbit1Stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="24 6 12 4"
      />

      {/* ═══ 2. OUTER VELOCITY ORBIT 2 (Inverse 60 deg tilt) ═══ */}
      <ellipse
        cx="18"
        cy="18"
        rx="15"
        ry="6.5"
        transform="rotate(30 18 18)"
        stroke={orbit2Stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="20 8 10 5"
      />

      {/* ═══ 3. EQUATORIAL STABILITY RING ═══ */}
      <ellipse
        cx="18"
        cy="18"
        rx="16"
        ry="5"
        stroke={isOffice ? '#818CF8' : isSupervisor ? '#F59E0B' : '#2DD4BF'}
        strokeWidth="1.2"
        strokeOpacity="0.45"
        strokeDasharray="4 4"
      />

      {/* ═══ 4. QUANTUM ATOMIC CORE (Geometric Hex-Polygon) ═══ */}
      <polygon
        points="18,10 24.5,13.8 24.5,22.2 18,26 11.5,22.2 11.5,13.8"
        fill={coreFill}
        stroke={coreStroke}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Core Glowing Fusion Center */}
      <circle cx="18" cy="18" r="4.2" fill={glowFill} />

      {/* Central Singularity Spark */}
      <circle
        cx="18"
        cy="18"
        r="1.8"
        fill="#FFFFFF"
        className="animate-pulse"
      />

      {/* ═══ 5. CARDINAL GPS ROUTING NODES (Express Transit Satellites) ═══ */}
      {/* North Node */}
      <circle
        cx="18"
        cy="3.5"
        r="1.5"
        fill={isOffice ? '#38BDF8' : isSupervisor ? '#FBBF24' : '#34D399'}
        stroke="#FFFFFF"
        strokeWidth="0.8"
      />
      {/* South Node */}
      <circle
        cx="18"
        cy="32.5"
        r="1.5"
        fill={isOffice ? '#9333EA' : isSupervisor ? '#EA580C' : '#0284C7'}
        stroke="#FFFFFF"
        strokeWidth="0.8"
      />
      {/* East Node */}
      <circle
        cx="32.5"
        cy="18"
        r="1.5"
        fill={isOffice ? '#4F46E5' : isSupervisor ? '#F59E0B' : '#10B981'}
        stroke="#FFFFFF"
        strokeWidth="0.8"
      />
      {/* West Node */}
      <circle
        cx="3.5"
        cy="18"
        r="1.5"
        fill={isOffice ? '#06B6D4' : isSupervisor ? '#FDE68A' : '#6EE7B7'}
        stroke="#FFFFFF"
        strokeWidth="0.8"
      />
    </svg>
  );
}

export interface AIAvatarProps {
  variant?: 'office' | 'student' | 'supervisor';
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
  showStatusBadge = true,
}: AIAvatarProps) {
  const isOffice = variant === 'office';
  const isSupervisor = variant === 'supervisor';

  const sizeMap = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const svgPixelMap = {
    xs: 20,
    sm: 24,
    md: 30,
    lg: 38,
    xl: 54,
  };

  const auraGradient = isOffice
    ? 'bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 dark:from-blue-500 dark:via-indigo-500 dark:to-cyan-400'
    : isSupervisor
    ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-500 dark:from-amber-400 dark:via-orange-400 dark:to-yellow-300'
    : 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-600 dark:from-emerald-500 dark:via-teal-400 dark:to-cyan-300';

  const capsuleBorder = isOffice
    ? 'bg-white/95 dark:bg-slate-900/90 border-indigo-200 dark:border-indigo-500/40 text-indigo-600 dark:text-cyan-300 shadow-indigo-500/15'
    : isSupervisor
    ? 'bg-white/95 dark:bg-slate-900/90 border-amber-200 dark:border-amber-500/40 text-amber-600 dark:text-amber-300 shadow-amber-500/15'
    : 'bg-white/95 dark:bg-slate-900/90 border-emerald-200 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-300 shadow-emerald-500/15';

  const badgeColor = isOffice
    ? 'bg-indigo-500'
    : isSupervisor
    ? 'bg-amber-500'
    : 'bg-emerald-500';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}
    >
      {/* Ambient Pulsing Aura */}
      <div
        className={`absolute -inset-0.5 rounded-2xl blur-xs transition-all duration-700 ${auraGradient} ${
          isThinking ? 'animate-ping scale-110 opacity-90' : 'opacity-60 animate-pulse'
        }`}
      />

      {/* Main Glassmorphic Capsule */}
      <div
        className={`relative z-10 w-full h-full rounded-2xl flex items-center justify-center overflow-hidden border shadow-md backdrop-blur-md transition-all duration-300 ${capsuleBorder}`}
      >
        {/* Specular Inner Glare */}
        <div className="absolute -top-3 -left-3 w-6 h-6 bg-white/60 dark:bg-white/20 rounded-full blur-xs pointer-events-none" />

        {/* Unique ATOMS AI Vector Icon */}
        <div className="relative z-20 flex items-center justify-center">
          {isThinking ? (
            <Sparkles
              className="animate-spin text-amber-500 dark:text-amber-300"
              style={{
                width: svgPixelMap[size],
                height: svgPixelMap[size],
                animationDuration: '3s',
              }}
            />
          ) : (
            <AILogo variant={variant} size={svgPixelMap[size]} />
          )}
        </div>
      </div>

      {/* Live Online Pulse Indicator */}
      {showStatusBadge && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 z-30 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 shadow-xs flex items-center justify-center ${badgeColor}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        </span>
      )}
    </div>
  );
}
