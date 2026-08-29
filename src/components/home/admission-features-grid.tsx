'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, MessageCircle, Star } from 'lucide-react';
import { useApp } from '@/lib/context';

export function AdmissionFeaturesGrid() {
  const { language } = useApp();

  const features = [
    {
      icon: Shield,
      title: language === 'bn' ? 'নিরাপদ যাত্রা' : 'Safe Transit',
      desc:
        language === 'bn'
          ? 'প্রশিক্ষিত ড্রাইভার ও নিবেদিত সুপারভাইজার'
          : 'Certified drivers & strict security management',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
    },
    {
      icon: Users,
      title: language === 'bn' ? 'অভিভাবকদের সাথে' : 'Guardian Accompanied',
      desc:
        language === 'bn'
          ? 'ছাত্র-ছাত্রী ও অভিভাবক একসাথে নিরাপদ আসন'
          : 'Student & guardian side-by-side seating',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      icon: MessageCircle,
      title: language === 'bn' ? 'WhatsApp সাপোর্ট' : 'WhatsApp Support',
      desc:
        language === 'bn'
          ? 'টিকিট ও আপডেট সরাসরি WhatsApp-এ'
          : 'Instant PDF ticket & countdown alert updates',
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-500/10',
    },
    {
      icon: Star,
      title: language === 'bn' ? 'প্রিমিয়াম সার্ভিস' : 'Premium Fleet',
      desc:
        language === 'bn'
          ? 'এসি বাস ও আরামদায়ক রিক্লাইনিং আসন'
          : 'AC executive coaches & reclining comfort',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
    },
  ];

  return (
    <section className="py-12 bg-white/50 dark:bg-slate-900/30 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div
                  className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}
                >
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  {item.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
