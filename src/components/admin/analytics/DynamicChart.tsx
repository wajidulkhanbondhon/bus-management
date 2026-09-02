'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, AreaSeries, LineSeries, HistogramSeries, ISeriesApi } from 'lightweight-charts';
import { useApp } from '@/lib/context';

export type ChartStyleType = 'area' | 'line' | 'bar';

interface ChartProps {
  data?: { time: string | number; value: number }[];
  datasets?: { label: string; data: { time: string | number; value: number }[]; color: string }[];
  type: ChartStyleType;
  color?: string;
  granularity?: 'sec' | 'min' | 'day' | 'month';
}

export function DynamicChart({ data, datasets, type, color = '#3b82f6', granularity = 'day' }: ChartProps) {
  const { theme } = useApp();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRefs = useRef<ISeriesApi<any>[]>([]);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    const isDark = theme === 'dark' || (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const textColor = isDark ? '#9ca3af' : '#4b5563';
    const gridColor = isDark ? 'rgba(75, 85, 99, 0.2)' : 'rgba(209, 213, 219, 0.5)';
    const borderColor = isDark ? 'rgba(75, 85, 99, 0.5)' : 'rgba(209, 213, 219, 1)';

    // Initialize chart if not already initialized
    if (!chartRef.current) {
      chartRef.current = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: textColor,
          fontFamily: "'Inter', 'Noto Sans Bengali', sans-serif",
        },
        grid: {
          vertLines: { color: gridColor },
          horzLines: { color: gridColor },
        },
        width: chartContainerRef.current.clientWidth,
        height: 300,
        timeScale: {
          borderColor: borderColor,
          timeVisible: granularity === 'sec' || granularity === 'min',
          secondsVisible: granularity === 'sec',
        },
      });
      // Important: if we just created a new chart, any old series is invalid
      seriesRefs.current = [];
    } else {
      // Update options for existing chart when theme changes
      chartRef.current.applyOptions({
        layout: { 
          textColor,
          fontFamily: "'Inter', 'Noto Sans Bengali', sans-serif" 
        },
        grid: {
          vertLines: { color: gridColor },
          horzLines: { color: gridColor },
        },
        timeScale: { 
          borderColor,
          timeVisible: granularity === 'sec' || granularity === 'min',
          secondsVisible: granularity === 'sec',
        },
      });
    }

    const chart = chartRef.current;

    // Remove old series
    seriesRefs.current.forEach(series => {
      try {
        chart.removeSeries(series);
      } catch (e) {
        // Ignore
      }
    });
    seriesRefs.current = [];
    const lastDataPointsRef = { current: [] as { time: string | number; value: number }[] };

    // Helper to add series
    const addSeriesData = (seriesData: { time: string | number; value: number }[], seriesColor: string) => {
      let series;
      if (type === 'area') {
        series = chart.addSeries(AreaSeries, {
          lineColor: seriesColor,
          topColor: `${seriesColor}80`,
          bottomColor: `${seriesColor}00`,
          lineWidth: 2,
        });
      } else if (type === 'line') {
        series = chart.addSeries(LineSeries, {
          color: seriesColor,
          lineWidth: 3,
        });
      } else if (type === 'bar') {
        series = chart.addSeries(HistogramSeries, {
          color: seriesColor,
          priceFormat: { type: 'volume' },
        });
      }

      if (series) {
        const sortedData = [...seriesData].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
        series.setData(sortedData);
        seriesRefs.current.push(series);
        if (sortedData.length > 0) {
          lastDataPointsRef.current.push({ ...sortedData[sortedData.length - 1] });
        }
      }
    };

    if (datasets && datasets.length > 0) {
      datasets.forEach(ds => addSeriesData(ds.data, ds.color));
    } else if (data) {
      addSeriesData(data, color);
    }
    
    chart.timeScale().fitContent();

    // Live Binance-style updates
    let ticks = 0;
    const ticksPerNewPoint = granularity === 'sec' ? 2 : granularity === 'min' ? 4 : 6;
    const interval = setInterval(() => {
      ticks++;
      const isNewPoint = ticks % ticksPerNewPoint === 0;

      seriesRefs.current.forEach((series, index) => {
        const lastPoint = lastDataPointsRef.current[index];
        if (!lastPoint) return;

        let newTime = lastPoint.time;

        if (isNewPoint) {
          if (typeof newTime === 'number') {
            if (granularity === 'sec') newTime += 1;
            else if (granularity === 'min') newTime += 60;
            else newTime += 86400;
          } else if (typeof newTime === 'string') {
            const d = new Date(newTime);
            if (granularity === 'day') d.setDate(d.getDate() + 1);
            else if (granularity === 'month') d.setMonth(d.getMonth() + 1);
            else d.setDate(d.getDate() + 1);
            newTime = d.toISOString().split('T')[0];
          }
        }

        // Calculate jitter/bouncing effect (2% jitter for current point, 5% for new point)
        const volatility = isNewPoint ? 0.05 : 0.02;
        const change = (Math.random() - 0.5) * (lastPoint.value * volatility);
        const newValue = Math.max(0, Math.floor(lastPoint.value + change));

        const newDataPoint = { time: newTime as any, value: newValue };

        try {
          series.update(newDataPoint);
          lastDataPointsRef.current[index] = newDataPoint;
        } catch (e) {
          // Ignore if series is disposed
        }
      });
    }, 600);

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, [data, datasets, type, color, theme, granularity]);

  // Cleanup chart on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRefs.current = [];
      }
    };
  }, []);

  return <div ref={chartContainerRef} className="w-full h-[300px]" />;
}
