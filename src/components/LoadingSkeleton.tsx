/**
 * Loading Skeleton Components
 * Reusable skeleton loaders for better UX during data loading
 */

export function SkeletonBlock({
  width = '100%',
  height = '1rem',
  rounded = false,
  className = '',
}: {
  width?: string;
  height?: string;
  rounded?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse bg-gray-200 ${rounded ? 'rounded' : ''} ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonText({
  lines = 1,
  maxWidth = '100%',
  className = '',
}: {
  lines?: number;
  maxWidth?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock
          key={i}
          width={i === lines - 1 ? `${Math.random() * 30 + 50}%` : '100%'}
          maxWidth={maxWidth}
          height="0.875rem"
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <SkeletonBlock width="40%" height="0.875rem" />
          <SkeletonBlock width="70%" height="1.5rem" />
        </div>
        <SkeletonBlock width="48px" height="48px" rounded />
      </div>
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  columns = 5,
  className = '',
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <SkeletonBlock
              key={i}
              width={`${100 / columns - 5}%`}
              height="0.75rem"
              className="flex-1"
            />
          ))}
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex items-center gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <SkeletonBlock
                  key={colIndex}
                  width={`${Math.random() * 30 + 50}%`}
                  height="0.875rem"
                  className="flex-1"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonBlock width="30%" height="0.875rem" />
          <SkeletonBlock width="100%" height="2.5rem" rounded />
        </div>
      ))}
    </div>
  );
}

export function SkeletonModal({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow-xl max-w-2xl w-full ${className}`}>
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <SkeletonBlock width="40%" height="1.25rem" />
        <SkeletonBlock width="24px" height="24px" rounded />
      </div>

      <div className="p-6">
        <SkeletonForm fields={5} />
      </div>

      <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
        <SkeletonBlock width="80px" height="2.25rem" rounded />
        <SkeletonBlock width="100px" height="2.25rem" rounded />
      </div>
    </div>
  );
}

export function SkeletonStatsCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
