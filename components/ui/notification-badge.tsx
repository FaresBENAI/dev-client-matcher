// components/ui/notification-badge.tsx
import React from 'react';

interface NotificationBadgeProps {
  count: number;
  children: React.ReactNode;
  className?: string;
}

export function NotificationBadge({ count, children, className = '' }: NotificationBadgeProps) {
  return (
    <div className={`relative inline-block ${className}`}>
      {children}
      {count > 0 && (
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs font-bold text-white ring-2 ring-white z-10">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </div>
  );
}
