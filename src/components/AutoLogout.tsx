'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { logoutAction } from '@/actions/auth.actions';

export function AutoLogout({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = useCallback(async () => {
    if (pathname === '/login') return;
    await logoutAction();
    router.push('/login?reason=timeout');
  }, [router, pathname]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const resetTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Set to 15 minutes = 15 * 60 * 1000
      timeoutRef.current = setTimeout(() => {
        handleLogout();
      }, 15 * 60 * 1000);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(name => {
      document.addEventListener(name, resetTimer, true);
    });

    resetTimer(); // init

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(name => {
        document.removeEventListener(name, resetTimer, true);
      });
    };
  }, [isLoggedIn, handleLogout]);

  return null;
}
