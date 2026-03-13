import React, { useState, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { hapticImpact } from '@/lib/haptics';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

/**
 * Native-style pull-to-refresh wrapper.
 * Only active on native platforms (iOS/Android via Capacitor).
 */
export function PullToRefresh({ onRefresh, children, className = '' }: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const isNative = Capacitor.isNativePlatform();
  const threshold = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isNative || refreshing) return;
    // Only activate when scrolled to top
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, [isNative, refreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling || refreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = Math.max(0, currentY - startY.current);
    // Dampened pull distance
    const dampened = Math.min(diff * 0.5, 120);
    setPullDistance(dampened);
  }, [pulling, refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) return;
    setPulling(false);

    if (pullDistance >= threshold) {
      setRefreshing(true);
      hapticImpact('medium');
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
    setPullDistance(0);
  }, [pulling, pullDistance, onRefresh]);

  return (
    <div
      ref={containerRef}
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {isNative && (pulling || refreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden transition-all"
          style={{ height: refreshing ? 48 : pullDistance }}
        >
          <div
            className={`w-6 h-6 border-2 border-primary border-t-transparent rounded-full ${
              refreshing ? 'animate-spin' : ''
            }`}
            style={{
              opacity: Math.min(pullDistance / threshold, 1),
              transform: `rotate(${pullDistance * 3}deg)`,
            }}
          />
        </div>
      )}
      {children}
    </div>
  );
}
