'use client';

import React from 'react';

/**
 * Code 39 Barcode — verified standard implementation.
 *
 * Each character is encoded as 9 elements alternating bar/space:
 *   index 0,2,4,6,8 → bar
 *   index 1,3,5,7   → space
 *   '0' = narrow (1 unit), '1' = wide (3 units)
 *
 * Source: ISO/IEC 16388:2007 Code 39 specification.
 */
const C39: Record<string, string> = {
  '0': '000110100', '1': '100100001', '2': '001100001',
  '3': '101100000', '4': '000110001', '5': '100110000',
  '6': '001110000', '7': '000100101', '8': '100100100',
  '9': '001100100',
  'A': '100001001', 'B': '001001001', 'C': '101001000',
  'D': '000011001', 'E': '100011000', 'F': '001011000',
  'G': '000001101', 'H': '100001100', 'I': '001001100',
  'J': '000011100', 'K': '100000011', 'L': '001000011',
  'M': '101000010', 'N': '000010011', 'O': '100010010',
  'P': '001010010', 'Q': '000000111', 'R': '100000110',
  'S': '001000110', 'T': '000010110', 'U': '110000001',
  'V': '011000001', 'W': '111000000', 'X': '010010001',
  'Y': '110010000', 'Z': '011010000',
  '-': '010000101', '.': '110000100', ' ': '011000100',
  '$': '010101000', '/': '010100010', '+': '010001010',
  '%': '000101010', '*': '010010100',
};

const NARROW = 1;
const WIDE   = 3;
const INTER_CHAR_GAP = 1; // narrow space between characters

/** Encode text → flat array of unit widths, true=bar false=space */
function encodeC39(text: string): { isBar: boolean; units: number }[] {
  const clean = '*' + (text.toUpperCase().replace(/[^A-Z0-9\-\. \$\/\+\%]/g, '-') || 'TICKET') + '*';
  const result: { isBar: boolean; units: number }[] = [];

  for (let ci = 0; ci < clean.length; ci++) {
    const bits = C39[clean[ci]] ?? C39['-'];
    for (let bi = 0; bi < bits.length; bi++) {
      result.push({
        isBar: bi % 2 === 0,          // even positions are bars
        units: bits[bi] === '1' ? WIDE : NARROW,
      });
    }
    // narrow inter-character gap (space) — except after last char
    if (ci < clean.length - 1) {
      result.push({ isBar: false, units: INTER_CHAR_GAP });
    }
  }

  return result;
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
  barColor = '#0f172a',
}: BarcodeProps) {
  if (!value) return null;

  const elements = encodeC39(value);
  const totalUnits = elements.reduce((sum, e) => sum + e.units, 0);

  // Build rect list — only bars
  const rects: { x: number; w: number }[] = [];
  let x = 0;
  for (const el of elements) {
    if (el.isBar) rects.push({ x, w: el.units });
    x += el.units;
  }

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${totalUnits} ${height}`}
        width="100%"
        height={height}
        style={{ display: 'block' }}
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        aria-label={`Barcode: ${value}`}
      >
        {rects.map((r, i) => (
          <rect key={i} x={r.x} y={0} width={r.w} height={height} fill={barColor} />
        ))}
      </svg>
      {showText && (
        <span
          className="font-mono text-[8px] tracking-[0.15em] uppercase text-slate-700 mt-0.5 font-bold"
          style={{ letterSpacing: '0.15em' }}
        >
          *{value}*
        </span>
      )}
    </div>
  );
}
