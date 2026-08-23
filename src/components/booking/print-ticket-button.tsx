'use client';

import React from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PrintTicketButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Button variant="primary" size="md" onClick={handlePrint} className="font-bold shadow-md shadow-blue-500/20">
      <Printer className="w-4 h-4 mr-1.5" />
      Print Ticket / PDF
    </Button>
  );
}
