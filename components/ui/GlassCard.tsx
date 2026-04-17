import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'hover-glow';
}

export function GlassCard({ children, className = '', variant = 'default' }: GlassCardProps) {
  const variantStyles = {
    'default': 'glass-card',
    'hover-glow': 'glass-card group',
  };

  return (
    <div className={`${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
}
