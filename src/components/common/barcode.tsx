'use client';

import React from 'react';

/**
 * Standard Code 128 Patterns (ISO/IEC 15417)
 * Each pattern specifies 6 alternating bar/space module widths summing to 11
 * (Stop character 106 has 7 widths summing to 13).
 */
const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112' // 100-106 (106 is STOP)
];

const START_B = 104;
const STOP = 106;
const QUIET_ZONE_MODULES = 10;

/**
 * Encodes text into Code 128B module elements.
 */
function encodeCode128(text: string): { isBar: boolean; units: number }[] {
  const clean = text.replace(/[\x00-\x1F\x7F-\xFF]/g, '');
  const charCodes: number[] = [START_B];

  for (let i = 0; i < clean.length; i++) {
    const val = clean.charCodeAt(i) - 32;
    charCodes.push(val >= 0 && val <= 95 ? val : 0);
  }

  // Calculate Checksum: (START + SUM(char_i * i)) % 103
  let checksum = charCodes[0];
  for (let i = 1; i < charCodes.length; i++) {
    checksum += charCodes[i] * i;
  }
  charCodes.push(checksum % 103);
  charCodes.push(STOP);

  const elements: { isBar: boolean; units: number }[] = [];

  // Left Quiet Zone
  elements.push({ isBar: false, units: QUIET_ZONE_MODULES });

  // Encode each character pattern
  for (const code of charCodes) {
    const pattern = CODE128_PATTERNS[code] || CODE128_PATTERNS[0];
    let isBar = true;
    for (let pi = 0; pi < pattern.length; pi++) {
      const width = parseInt(pattern[pi], 10);
      elements.push({ isBar, units: width });
      isBar = !isBar;
    }
  }

  // Right Quiet Zone
  elements.push({ isBar: false, units: QUIET_ZONE_MODULES });

  return elements;
}

interface BarcodeProps {
  value: string;
  height?: number;
  showText?: boolean;
  className?: string;
  barColor?: string;
  bgColor?: string;
}

export function BarcodeView({
  value,
  height = 36,
  showText = true,
  className = '',
  barColor = '#000000',
  bgColor = '#ffffff',
}: BarcodeProps) {
  if (!value) return null;

  const elements = encodeCode128(value);
  const totalUnits = elements.reduce((sum, e) => sum + e.units, 0);

  // Build bar rects list
  const rects: { x: number; w: number }[] = [];
  let x = 0;
  for (const el of elements) {
    if (el.isBar) {
      rects.push({ x, w: el.units });
    }
    x += el.units;
  }

  return (
    <div className={`inline-flex flex-col items-center select-none bg-white p-1 rounded ${className}`}>
      <svg
        viewBox={`0 0 ${totalUnits} ${height}`}
        width="100%"
        height={height}
        style={{ display: 'block', maxWidth: '100%' }}
        preserveAspectRatio="none"
        aria-label={`Barcode: ${value}`}
      >
        {/* Background */}
        <rect x={0} y={0} width={totalUnits} height={height} fill={bgColor} />
        {/* Bars */}
        {rects.map((r, i) => (
          <rect
            key={i}
            x={r.x}
            y={0}
            width={r.w}
            height={height}
            fill={barColor}
          />
        ))}
      </svg>
      {showText && (
        <span
          className="font-mono text-[9px] tracking-[0.18em] uppercase text-slate-900 mt-1 font-black"
          style={{ letterSpacing: '0.18em' }}
        >
          *{value}*
        </span>
      )}
    </div>
  );
}
