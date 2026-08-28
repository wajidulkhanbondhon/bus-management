'use client';

import React from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PrintTicketButtonProps {
  booking?: any;
  className?: string;
}

export function PrintTicketButton({ booking, className }: PrintTicketButtonProps) {
  const handlePrint = () => {
    if (booking?.id) {
      window.open(`/bookings/${booking.id}`, '_blank');
    } else {
      window.print();
    }
  };

  return (
    <Button
      variant="primary"
      size="md"
      onClick={handlePrint}
      className={className || "font-bold shadow-md shadow-blue-500/20 text-xs"}
    >
      <Printer className="w-4 h-4 mr-1.5" />
      ডিজিটাল টিকিট প্রিন্ট / ভিউ করুন
    </Button>
  );
}

