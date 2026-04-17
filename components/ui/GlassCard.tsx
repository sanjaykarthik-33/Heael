import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover-glow';
}

export function GlassCard({ children, className = '', variant = 'default', ...props }: GlassCardProps) {
  const variantStyles = {
    'default': 'glass-card',
    'hover-glow': 'glass-card group',
  };

  return (
    <div className={`${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
