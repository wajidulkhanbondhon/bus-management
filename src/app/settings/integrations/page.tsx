'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/lib/context';
import { useToast } from '@/components/ui/toast';
import {
  Plug,
  Save,
  CheckCircle2,
  Code,
  Globe,
  Tag,
  MonitorSmartphone
} from 'lucide-react';

export default function IntegrationsSettingsPage() {
  const { language, marketingIntegrations, setMarketingIntegrations } = useApp();
  const { success: showSuccessToast } = useToast();

  const [gaId, setGaId] = useState(marketingIntegrations.gaId);
  const [pixelId, setPixelId] = useState(marketingIntegrations.pixelId);
  const [gtmId, setGtmId] = useState(marketingIntegrations.gtmId || '');
  const [customGaHtml, setCustomGaHtml] = useState(marketingIntegrations.customGaHtml);
  const [customPixelHtml, setCustomPixelHtml] = useState(marketingIntegrations.customPixelHtml);
  const [customGtmHtml, setCustomGtmHtml] = useState(marketingIntegrations.customGtmHtml || '');

  // Modes: 'id' or 'custom'
  const [gaMode, setGaMode] = useState<'id' | 'custom'>(marketingIntegrations.customGaHtml ? 'custom' : 'id');
  const [pixelMode, setPixelMode] = useState<'id' | 'custom'>(marketingIntegrations.customPixelHtml ? 'custom' : 'id');
  const [gtmMode, setGtmMode] = useState<'id' | 'custom'>(marketingIntegrations.customGtmHtml ? 'custom' : 'id');

  useEffect(() => {
    setGaId(marketingIntegrations.gaId);
    setPixelId(marketingIntegrations.pixelId);
    setGtmId(marketingIntegrations.gtmId || '');
    setCustomGaHtml(marketingIntegrations.customGaHtml);
    setCustomPixelHtml(marketingIntegrations.customPixelHtml);
    setCustomGtmHtml(marketingIntegrations.customGtmHtml || '');
    
    setGaMode(marketingIntegrations.customGaHtml ? 'custom' : 'id');
    setPixelMode(marketingIntegrations.customPixelHtml ? 'custom' : 'id');
    setGtmMode(marketingIntegrations.customGtmHtml ? 'custom' : 'id');
  }, [marketingIntegrations]);

  const handleSaveGTM = () => {
    setMarketingIntegrations({ 
      ...marketingIntegrations, 
      gtmId: gtmMode === 'id' ? gtmId : '', 
      customGtmHtml: gtmMode === 'custom' ? customGtmHtml : '' 
    });
    showSuccessToast(language === 'bn' ? 'GTM সেটিংস সেভ করা হয়েছে!' : 'GTM settings saved!');
  };

  const handleSaveGA = () => {
    setMarketingIntegrations({ 
      ...marketingIntegrations, 
      gaId: gaMode === 'id' ? gaId : '', 
      customGaHtml: gaMode === 'custom' ? customGaHtml : '' 
    });
    showSuccessToast(language === 'bn' ? 'GA সেটিংস সেভ করা হয়েছে!' : 'GA settings saved!');
  };

  const handleSavePixel = () => {
    setMarketingIntegrations({ 
      ...marketingIntegrations, 
      pixelId: pixelMode === 'id' ? pixelId : '', 
      customPixelHtml: pixelMode === 'custom' ? customPixelHtml : '' 
    });
    showSuccessToast(language === 'bn' ? 'Pixel সেটিংস সেভ করা হয়েছে!' : 'Pixel settings saved!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800">
              <Plug className="w-3.5 h-3.5 mr-1" />
              Settings
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {language === 'bn' ? 'মার্কেটিং ইন্টিগ্রেশনস' : 'Marketing Integrations'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {language === 'bn' ? 'আপনার মার্কেটিং টুলসগুলো আলাদাভাবে কানেক্ট করুন।' : 'Connect your marketing tools individually.'}
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        
        {/* Google Tag Manager Card */}
        <Card className="p-6 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center shrink-0">
              <Tag className="w-7 h-7 text-blue-500" />
            </div>
            <div className="flex-1 space-y-4 w-full">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Google Tag Manager
                    {marketingIntegrations.gtmId || marketingIntegrations.customGtmHtml ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : null}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Manage all your website tags without editing code.</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl inline-flex gap-1 border border-slate-200 dark:border-slate-800">
                <button 
                  onClick={() => setGtmMode('id')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${gtmMode === 'id' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Use Container ID
                </button>
                <button 
                  onClick={() => setGtmMode('custom')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${gtmMode === 'custom' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Custom Script
                </button>
              </div>

              {gtmMode === 'id' ? (
                <div className="relative max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Code className="w-4 h-4 text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    value={gtmId}
                    onChange={e => setGtmId(e.target.value)}
                    placeholder="e.g. GTM-XXXXXXX"
                    className="w-full pl-9 pr-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-indigo-500 focus:outline-none" 
                  />
                </div>
              ) : (
                <textarea 
                  value={customGtmHtml}
                  onChange={e => setCustomGtmHtml(e.target.value)}
                  placeholder="Paste your raw Google Tag Manager HTML <script> snippet here..."
                  className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-indigo-500 focus:outline-none h-24 font-mono text-xs" 
                />
              )}

              <div className="pt-2">
                <Button onClick={handleSaveGTM} size="sm" className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                  <Save className="w-4 h-4 mr-2" /> {language === 'bn' ? 'সেভ করুন' : 'Save GTM'}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Google Analytics Card */}
        <Card className="p-6 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.012 3.593c-.929 0-1.685.753-1.685 1.678v13.457c0 .927.756 1.679 1.685 1.679h.001c.928 0 1.685-.753 1.685-1.678V5.271c0-.926-.757-1.678-1.686-1.678zm-6.262 5.093c-.929 0-1.685.752-1.685 1.678v8.364c0 .927.756 1.679 1.685 1.679.928 0 1.684-.753 1.684-1.678V10.364c0-.926-.756-1.678-1.684-1.678zm12.522 5.127c-.928 0-1.685.753-1.685 1.679v3.238c0 .926.757 1.678 1.685 1.678h.001c.928 0 1.684-.752 1.684-1.678v-3.238c0-.926-.756-1.679-1.685-1.679z"/>
              </svg>
            </div>
            <div className="flex-1 space-y-4 w-full">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Google Analytics (GA4)
                    {marketingIntegrations.gaId || marketingIntegrations.customGaHtml ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : null}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Track page views, traffic sources, and user behavior.</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl inline-flex gap-1 border border-slate-200 dark:border-slate-800">
                <button 
                  onClick={() => setGaMode('id')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${gaMode === 'id' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Use Measurement ID
                </button>
                <button 
                  onClick={() => setGaMode('custom')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${gaMode === 'custom' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Custom Script
                </button>
              </div>

              {gaMode === 'id' ? (
                <div className="relative max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Code className="w-4 h-4 text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    value={gaId}
                    onChange={e => setGaId(e.target.value)}
                    placeholder="e.g. G-ABC123XYZ"
                    className="w-full pl-9 pr-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-indigo-500 focus:outline-none" 
                  />
                </div>
              ) : (
                <textarea 
                  value={customGaHtml}
                  onChange={e => setCustomGaHtml(e.target.value)}
                  placeholder="Paste your raw Google Analytics HTML <script> snippet here..."
                  className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-indigo-500 focus:outline-none h-24 font-mono text-xs" 
                />
              )}

              <div className="pt-2">
                <Button onClick={handleSaveGA} size="sm" className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                  <Save className="w-4 h-4 mr-2" /> {language === 'bn' ? 'সেভ করুন' : 'Save GA'}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Meta Pixel Card */}
        <Card className="p-6 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10.82 12.78c-.28-.5-.87-1.42-1.84-2.16-1.12-.86-2.3-1.16-3.32-1.02-1.22.17-2.3.93-2.92 2.06-.65 1.18-.58 2.62.19 3.66.7.94 1.76 1.48 2.94 1.5 1.45.02 3.01-.63 4.31-2.02.5-.53.94-1.14 1.34-1.78l1.45-2.31c.28-.46.59-.92.93-1.37a9.38 9.38 0 0 1 2.37-2.19c1.07-.68 2.13-.93 3.1-.8 1.23.16 2.3.92 2.92 2.05.65 1.18.57 2.62-.2 3.66-.7.94-1.76 1.48-2.93 1.5-1.45.02-3.02-.63-4.32-2.02a9.66 9.66 0 0 1-1.36-1.8l-.29.47c.5.8 1.05 1.55 1.63 2.22 1.63 1.92 3.66 2.87 5.58 2.84 1.83-.03 3.44-1.03 4.41-2.73a5.55 5.55 0 0 0 .5-4.8 5.48 5.48 0 0 0-3.95-3.02c-1.47-.2-3.04.2-4.52 1.13-1.25.79-2.3 1.77-3.03 2.62-1.15 1.33-2 2.76-2.5 3.55l-1.08 1.72c-.22.36-.45.71-.69 1.05a9.42 9.42 0 0 1-2.36 2.18c-1.07.69-2.12.94-3.1.8-1.21-.16-2.28-.9-2.9-2.02a5.55 5.55 0 0 1-.5-4.78 5.46 5.46 0 0 1 3.94-3.01c1.47-.2 3.04.2 4.51 1.13 1.26.8 2.3 1.78 3.04 2.63l.42.5.42-.68z"/>
              </svg>
            </div>
            <div className="flex-1 space-y-4 w-full">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Meta (Facebook) Pixel
                    {marketingIntegrations.pixelId || marketingIntegrations.customPixelHtml ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : null}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Track Facebook ad conversions and build audiences.</p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl inline-flex gap-1 border border-slate-200 dark:border-slate-800">
                <button 
                  onClick={() => setPixelMode('id')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${pixelMode === 'id' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Use Pixel ID
                </button>
                <button 
                  onClick={() => setPixelMode('custom')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${pixelMode === 'custom' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  Custom Script
                </button>
              </div>

              {pixelMode === 'id' ? (
                <div className="relative max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Code className="w-4 h-4 text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    value={pixelId}
                    onChange={e => setPixelId(e.target.value)}
                    placeholder="e.g. 123456789012345"
                    className="w-full pl-9 pr-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-indigo-500 focus:outline-none" 
                  />
                </div>
              ) : (
                <textarea 
                  value={customPixelHtml}
                  onChange={e => setCustomPixelHtml(e.target.value)}
                  placeholder="Paste your raw Meta Pixel HTML <script> snippet here..."
                  className="w-full px-3 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-sm focus:border-indigo-500 focus:outline-none h-24 font-mono text-xs" 
                />
              )}

              <div className="pt-2">
                <Button onClick={handleSavePixel} size="sm" className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                  <Save className="w-4 h-4 mr-2" /> {language === 'bn' ? 'সেভ করুন' : 'Save Pixel'}
                </Button>
              </div>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
