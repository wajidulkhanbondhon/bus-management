'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Filter,
  TrendingUp
} from 'lucide-react';
import { useApp } from '@/lib/context';

interface Review {
  id: string;
  passengerName: string;
  route: string;
  rating: number;
  comment: string;
  date: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
}

const dummyReviews: Review[] = [
  { id: '1', passengerName: 'Rakibul Islam', route: 'Dhaka - Cox\'s Bazar', rating: 5, comment: 'অসাধারণ সার্ভিস! সময়মতো বাস এসেছে এবং ড্রাইভার খুবই দক্ষ ছিলেন।', date: '2 hours ago', status: 'APPROVED' },
  { id: '2', passengerName: 'Nusrat Jahan', route: 'Sylhet - Dhaka', rating: 4, comment: 'ভালো সার্ভিস, কিন্তু AC একটু দুর্বল ছিল। বাকি সব ঠিক আছে।', date: '5 hours ago', status: 'APPROVED' },
  { id: '3', passengerName: 'Kamrul Hasan', route: 'Dhaka - Rajshahi', rating: 2, comment: 'বাস ৩০ মিনিট লেট ছিল, সিট কমফোর্টেবল না।', date: '1 day ago', status: 'PENDING' },
  { id: '4', passengerName: 'Sadia Afrin', route: 'Chittagong - Dhaka', rating: 5, comment: 'সেরা বাস সার্ভিস! আবার এই সার্ভিসে যাব ইনশাআল্লাহ।', date: '2 days ago', status: 'APPROVED' },
  { id: '5', passengerName: 'Tariqul Islam', route: 'Dhaka - Khulna', rating: 3, comment: 'মোটামুটি ভালো। দাম একটু কম হলে ভালো হতো।', date: '3 days ago', status: 'PENDING' },
];

export default function ReviewsPage() {
  const { language } = useApp();
  const [reviews, setReviews] = useState<Review[]>(dummyReviews);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');

  const filteredReviews = filterStatus === 'ALL' ? reviews : reviews.filter(r => r.status === filterStatus);
  const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);

  const updateStatus = (id: string, status: Review['status']) => {
    setReviews(reviews.map(r => r.id === id ? { ...r, status } : r));
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
    ));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="primary" className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-800">
            <Star className="w-3.5 h-3.5 mr-1 fill-amber-500" />
            Customer Feedback
          </Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
          {language === 'bn' ? 'রিভিউ ও রেটিং' : 'Reviews & Ratings'}
        </h1>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <span className="text-xs font-bold text-amber-700 uppercase font-mono">Average Rating</span>
          <div className="text-3xl font-black text-amber-900 dark:text-amber-200 mt-1 flex items-center gap-2">
            {avgRating}
            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
          </div>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-bold text-slate-500 uppercase font-mono flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> মোট রিভিউ</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">{reviews.length}</div>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-bold text-emerald-600 uppercase font-mono flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> Positive (4-5★)</span>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">{reviews.filter(r => r.rating >= 4).length}</div>
        </Card>
        <Card className="p-4">
          <span className="text-xs font-bold text-rose-600 uppercase font-mono flex items-center gap-1"><ThumbsDown className="w-3.5 h-3.5" /> Negative (1-2★)</span>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-400 font-mono mt-1">{reviews.filter(r => r.rating <= 2).length}</div>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(status => (
          <button key={status} onClick={() => setFilterStatus(status)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterStatus === status ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'}`}>
            {status}
          </button>
        ))}
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        {filteredReviews.map(review => (
          <Card key={review.id} className="p-5 border-2 border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-sm text-slate-600 dark:text-slate-300">
                    {review.passengerName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{review.passengerName}</h4>
                    <p className="text-[11px] text-slate-500">{review.route} • {review.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-2">{renderStars(review.rating)}</div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">"{review.comment}"</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase
                  ${review.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                    review.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                  {review.status}
                </span>
                {review.status === 'PENDING' && (
                  <div className="flex gap-1.5">
                    <button onClick={() => updateStatus(review.id, 'APPROVED')} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"><ThumbsUp className="w-3.5 h-3.5" /></button>
                    <button onClick={() => updateStatus(review.id, 'REJECTED')} className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"><ThumbsDown className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
