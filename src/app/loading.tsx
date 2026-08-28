import React from 'react';

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <div className="w-16 h-16 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin absolute top-0 left-0" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      <h3 className="mt-6 text-lg font-semibold text-slate-700 dark:text-slate-300 animate-pulse">
        লগ হচ্ছে...
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
        অনুগ্রহ করে অপেক্ষা করুন
      </p>
    </div>
  );
}
