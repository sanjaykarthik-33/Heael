'use client';

import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 overflow-y-auto pb-20 md:pb-0">
        <div className="animate-fade-in p-4 md:p-6">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
