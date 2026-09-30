import React from "react";

/**
 * Modern, accessible, and versatile Skeleton component
 * Matches Dukan's warm color palette and typography
 */
export const Skeleton = ({
  className = "",
  variant = "rectangular",
  width,
  height,
  animate = true,
  ...props
}) => {
  const variantStyles = {
    text: "h-4 rounded-md w-full",
    circular: "rounded-full shrink-0",
    rounded: "rounded-xl",
    rectangular: "rounded-lg",
  };

  const style = {
    ...(width && { width: typeof width === "number" ? `${width}px` : width }),
    ...(height && { height: typeof height === "number" ? `${height}px` : height }),
  };

  return (
    <div
      role="status"
      aria-label="جارٍ التحميل..."
      style={style}
      className={`relative overflow-hidden bg-primary/10 ${variantStyles[variant] || "rounded-lg"} ${
        animate ? "animate-pulse" : ""
      } ${className}`}
      {...props}
    >
      {/* Subtle warm shimmer overlay */}
      <span className="sr-only">جارٍ التحميل...</span>
    </div>
  );
};

/**
 * Reusable Skeleton Table component for data grids (Users, Products, Orders, etc.)
 */
export const SkeletonTable = ({
  rows = 5,
  columns = 5,
  hasAvatar = true,
  className = "",
}) => {
  return (
    <div className={`overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-xs ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-primary/10 bg-surface/40 text-textSecondary">
              {Array.from({ length: columns }).map((_, colIdx) => (
                <th key={colIdx} className="px-5 py-3.5">
                  <Skeleton className="h-4 w-20 bg-primary/15" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-surface/10">
                {/* Column 1: Info with optional avatar */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    {hasAvatar && (
                      <Skeleton variant="circular" className="h-9 w-9 bg-primary/15 shrink-0" />
                    )}
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-32 bg-primary/15" />
                      <Skeleton className="h-2.5 w-44 bg-primary/10" />
                    </div>
                  </div>
                </td>

                {/* Column 2: Badge */}
                <td className="px-5 py-3.5">
                  <Skeleton className="h-6 w-24 rounded-lg bg-primary/15" />
                </td>

                {/* Column 3: Secondary code / details */}
                <td className="px-5 py-3.5 hidden md:table-cell">
                  <Skeleton className="h-5 w-28 rounded-md bg-primary/10" />
                </td>

                {/* Column 4: Date / Meta */}
                <td className="px-5 py-3.5 hidden sm:table-cell">
                  <Skeleton className="h-3.5 w-20 bg-primary/10" />
                </td>

                {/* Column 5: Action button */}
                <td className="px-5 py-3.5 text-center">
                  <div className="flex justify-center">
                    <Skeleton variant="circular" className="h-7 w-7 bg-primary/15" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center justify-between border-t border-primary/10 bg-surface/20 px-5 py-3">
        <Skeleton className="h-3.5 w-36 bg-primary/15" />
        <Skeleton className="h-3 w-28 bg-primary/10" />
      </div>
    </div>
  );
};

/**
 * Reusable Metrics / Stats Skeleton Grid
 */
export const SkeletonStats = ({ count = 3, className = "" }) => {
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-3 ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between rounded-2xl border border-primary/10 bg-white p-5 shadow-xs"
        >
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3.5 w-24 bg-primary/15" />
            <Skeleton className="h-7 w-16 bg-primary/20" />
          </div>
          <Skeleton variant="rounded" className="h-12 w-12 rounded-2xl bg-surface" />
        </div>
      ))}
    </div>
  );
};

/**
 * Reusable Card Skeleton
 */
export const SkeletonCard = ({ className = "", lines = 3 }) => {
  return (
    <div className={`rounded-2xl border border-primary/10 bg-white p-5 shadow-xs space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32 bg-primary/20" />
        <Skeleton variant="circular" className="h-8 w-8 bg-primary/15" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, idx) => (
          <Skeleton
            key={idx}
            className={`h-3.5 bg-primary/10 ${idx === lines - 1 ? "w-2/3" : "w-full"}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Skeleton;
