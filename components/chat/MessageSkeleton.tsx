'use client';

/**
 * Skeleton placeholder shown while the AI is composing its first token.
 */
export function MessageSkeleton() {
  return (
    <div className="flex gap-3 animate-fade-in" aria-label="AI is thinking…" aria-busy="true">
      {/* Avatar skeleton */}
      <div className="skeleton w-6 h-6 rounded shrink-0 mt-0.5" />

      {/* Content lines */}
      <div className="flex-1 space-y-2 pt-0.5">
        <div className="skeleton h-3 rounded w-3/4" />
        <div className="skeleton h-3 rounded w-1/2" />
        <div className="skeleton h-3 rounded w-5/6" />
      </div>
    </div>
  );
}