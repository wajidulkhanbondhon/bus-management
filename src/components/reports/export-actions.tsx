'use client';

import React from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';

interface Props {
  reportData: any;
  filename?: string;
}

export function ExportActions({ reportData, filename = 'ATOMS_Report' }: Props) {
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportToCSV = () => {
    const ws = XLSX.utils.json_to_sheet(reportData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={exportToCSV} className="font-semibold">
        <Download className="w-3.5 h-3.5 mr-1" />
        CSV
      </Button>
      <Button variant="outline" size="sm" onClick={exportToExcel} className="font-semibold text-emerald-700 hover:bg-emerald-50">
        <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" />
        Excel (.xlsx)
      </Button>
      <Button variant="primary" size="sm" onClick={exportToPDF} className="font-bold">
        <FileText className="w-3.5 h-3.5 mr-1" />
        Print PDF Summary
      </Button>
    </div>
  );
}
