'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
  darkColor?: string;
  lightColor?: string;
  includeMargin?: boolean;
  alt?: string;
}

export function QRCodeView({
  value,
  size = 140,
  className = '',
  darkColor = '#0f172a',
  lightColor = '#ffffff',
  includeMargin = true,
  alt = 'Verification QR Code'
}: QRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!value) return;

    let isMounted = true;
    QRCode.toDataURL(value, {
      width: size * 2, // High DPI for crisp printing
      margin: includeMargin ? 1 : 0,
      color: {
        dark: darkColor,
        light: lightColor
      },
      errorCorrectionLevel: 'M'
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
          setError(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [value, size, darkColor, lightColor, includeMargin]);

  if (error || !dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 font-mono text-center p-2 ${className}`}
      >
        <span>{error ? 'QR Error' : 'Generating...'}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt={alt}
      width={size}
      height={size}
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`rounded-lg transition-transform ${className}`}
      loading="eager"
    />
  );
}
