'use client';

import React from 'react';
import { UserCheck, Shield, Users, Calculator, Sparkles } from 'lucide-react';

interface QuickRole {
  roleName: string;
  designation: string;
  email: string;
  icon: React.ElementType;
  badgeColor: string;
}

const DEMO_ROLES: QuickRole[] = [
  {
    roleName: 'Super Admin',
    designation: 'Director / Executive',
    email: 'admin@transport.office',
    icon: Shield,
    badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200 dark:text-indigo-300 dark:bg-indigo-950/60 dark:border-indigo-800',
  },
  {
    roleName: 'Manager',
    designation: 'Route Supervisor',
    email: 'manager@transport.office',
    icon: Users,
    badgeColor: 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/60 dark:border-blue-800',
  },
  {
    roleName: 'Booking Staff',
    designation: 'Counter Operator',
    email: 'staff@transport.office',
    icon: UserCheck,
    badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800',
  },
  {
    roleName: 'Accountant',
    designation: 'Day-Closing Cashier',
    email: 'accountant@transport.office',
    icon: Calculator,
    badgeColor: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/60 dark:border-amber-800',
  },
];

interface UserRoleQuickSelectorProps {
  onSelectRole: (email: string) => void;
  activeEmail?: string;
}

export function UserRoleQuickSelector({
  onSelectRole,
  activeEmail,
}: UserRoleQuickSelectorProps) {
  return (
    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Quick Role Sign-In
        </span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">PIN: admin1234</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {DEMO_ROLES.map((role) => {
          const Icon = role.icon;
          const isSelected = activeEmail === role.email;

          return (
            <button
              key={role.email}
              type="button"
              onClick={() => onSelectRole(role.email)}
              className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between space-y-1.5 shadow-2xs ${
                isSelected
                  ? 'bg-blue-50/80 dark:bg-blue-950/60 border-blue-500 shadow-sm shadow-blue-500/10'
                  : 'bg-slate-50 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  {role.roleName}
                </span>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md border ${role.badgeColor}`}
                >
                  Demo
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate font-medium">
                {role.designation}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
