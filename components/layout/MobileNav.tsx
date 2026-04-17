'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Zap, Flame, User } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/insights', label: 'Insights', icon: Zap },
  { href: '/arena', label: 'Arena', icon: Flame },
  { href: '/profile', label: 'Profile', icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-primary/20 bg-background/95 backdrop-blur-lg flex justify-around pb-safe">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 py-3 px-4 transition-all duration-300 ${
              isActive ? 'text-primary' : 'text-foreground/50'
            }`}
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
