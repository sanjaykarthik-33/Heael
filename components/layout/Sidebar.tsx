'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Zap, Flame, User, Home } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/insights', label: 'Insights', icon: Zap },
  { href: '/arena', label: 'Arena', icon: Flame },
  { href: '/profile', label: 'Profile', icon: User },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass-effect border-r border-primary/20 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-primary/20">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
          ⚡
        </div>
        <span className="text-xl font-bold neon-glow-purple">Heael</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'bg-primary/20 text-primary neon-border-purple'
                  : 'text-foreground/70 hover:text-foreground hover:bg-white/5'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-primary/20">
        <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg p-4 text-sm">
          <p className="font-semibold text-primary mb-1">Wellness Streak</p>
          <p className="text-foreground/70">12 days active 🔥</p>
        </div>
      </div>
    </aside>
  );
}
