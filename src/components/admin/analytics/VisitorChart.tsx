'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, LineSeries } from 'lightweight-charts';

interface ChartProps {
  data: { time: string; value: number }[];
}

export function VisitorChart({ data }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af', // gray-400
      },
      grid: {
        vertLines: { color: 'rgba(75, 85, 99, 0.3)' }, // gray-600 with opacity
        horzLines: { color: 'rgba(75, 85, 99, 0.3)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      timeScale: {
        borderColor: 'rgba(75, 85, 99, 0.5)',
      },
    });

    const lineSeries = chart.addSeries(LineSeries, {
      color: '#f59e0b', // amber-500
      lineWidth: 3,
    });

    // Ensure data is sorted by time ascending (required by lightweight-charts)
    const sortedData = [...data].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    lineSeries.setData(sortedData);

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  return <div ref={chartContainerRef} className="w-full h-[300px]" />;
}
