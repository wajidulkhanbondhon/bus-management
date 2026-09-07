'use client';

import React from 'react';

/**
 * Standard Code 39 Barcode SVG Generator
 * Code 39 supports uppercase letters A-Z, digits 0-9, and symbols: - . $ / + % SPACE *
 */
const CODE39_PATTERNS: Record<string, string> = {
  '0': 'bwbwbwBwb',
  '1': 'BwbwbwBwb',
  '2': 'bwBwbwBwb',
  '3': 'BwBwbwbwb',
  '4': 'bwbwBwBwb',
  '5': 'BwbwBwbwb',
  '6': 'bwBwBwbwb',
  '7': 'bwbwbwBwB',
  '8': 'BwbwbwBwB',
  '9': 'bwBwbwBwB',
  'A': 'BwbwbwbwB',
  'B': 'bwBwbwbwB',
  'C': 'BwBwbwbwb',
  'D': 'bwbwBwbwB',
  'E': 'BwbwBwbwb',
  'F': 'bwBwBwbwb',
  'G': 'bwbwbwBwB',
  'H': 'BwbwbwBwb',
  'I': 'bwBwbwBwb',
  'J': 'bwbwBwBwb',
  'K': 'Bwbwbwbwb',
  'L': 'bwBwbwbwb',
  'M': 'BwBwbwbwb',
  'N': 'bwbwBwbwb',
  'O': 'BwbwBwbwb',
  'P': 'bwBwBwbwb',
  'Q': 'bwbwbwBwb',
  'R': 'BwbwbwBwb',
  'S': 'bwBwbwBwb',
  'T': 'bwbwBwBwb',
  'U': 'Bwbwbwbwb',
  'V': 'bwBwbwbwb',
  'W': 'BwBwbwbwb',
  'X': 'bwbwBwbwb',
  'Y': 'BwbwBwbwb',
  'Z': 'bwBwBwbwb',
  '-': 'bwbwbwBwb',
  '.': 'Bwbwbwbwb',
  ' ': 'bwBwbwbwb',
  '$': 'bwbwbwbwb',
  '/': 'bwbwbwbwb',
  '+': 'bwbwbwbwb',
  '%': 'bwbwbwbwb',
  '*': 'bwbwBwbwB' // Start / Stop delimiter
};

// Convert pattern (b = narrow bar, B = wide bar, w = narrow space, W = wide space)
function encodeToBars(text: string): boolean[] {
  const clean = '*' + (text.toUpperCase().replace(/[^A-Z0-9\-\.\ \$\/\+\%]/g, '-') || 'TICKET') + '*';
  const bars: boolean[] = [];

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const pattern = CODE39_PATTERNS[char] || CODE39_PATTERNS['-'];
    
    for (let p = 0; p < pattern.length; p++) {
      const isBar = pattern[p] === 'b' || pattern[p] === 'B';
      const isWide = pattern[p] === 'B' || pattern[p] === 'W';
      const width = isWide ? 3 : 1;
      for (let w = 0; w < width; w++) {
        bars.push(isBar);
      }
    }
    // Inter-character narrow space
    bars.push(false);
  }

  return bars;
}

interface BarcodeProps {
  value: string;
  height?: number;
  showText?: boolean;
  className?: string;
  barColor?: string;
}

export function BarcodeView({
  value,
  height = 36,
  showText = true,
  className = '',
  barColor = '#0f172a'
}: BarcodeProps) {
  if (!value) return null;

  const bars = encodeToBars(value);
  const totalUnits = bars.length;

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${totalUnits} ${height}`}
        className="w-full h-auto overflow-hidden"
        style={{ maxHeight: height }}
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
      >
        {bars.map((isBar, idx) =>
          isBar ? (
            <rect
              key={idx}
              x={idx}
              y={0}
              width={1}
              height={height}
              fill={barColor}
            />
          ) : null
        )}
      </svg>
      {showText && (
        <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-slate-700 dark:text-slate-300 mt-0.5 font-bold">
          *{value}*
        </span>
      )}
    </div>
  );
}
