import { ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from "lucide-react";
import { SkeletonTable } from "./Skeleton";

/**
 * Reusable DataTable component for Dukan admin panel.
 *
 * @param {object} props
 * @param {Array<{ key: string, label: string, className?: string, render: (row) => JSX }>} props.columns
 * @param {Array<object>} props.data - Row data array
 * @param {string} props.rowKey - Unique key field from each row (e.g. "_id")
 * @param {boolean} props.isLoading
 * @param {boolean} props.isError
 * @param {object} props.error
 * @param {Function} props.onRetry - Called when error retry button is clicked
 * @param {object} props.pagination - { totalItems, totalPages, currentPage, hasNext, hasPrev }
 * @param {Function} props.onPageChange - (newPage) => void
 * @param {JSX.Element} props.emptyIcon - Icon component for empty state
 * @param {string} props.emptyTitle
 * @param {string} props.emptyDescription
 * @param {number} props.skeletonRows - Number of skeleton rows while loading
 * @param {number} props.skeletonColumns - Number of skeleton columns while loading
 * @param {boolean} props.skeletonHasAvatar
 * @param {string} props.itemLabel - Label for the items (e.g. "مستخدم", "فئة")
 */
function DataTable({
  columns = [],
  data = [],
  rowKey = "_id",
  isLoading = false,
  isError = false,
  error = null,
  onRetry,
  pagination,
  onPageChange,
  emptyIcon: EmptyIcon,
  emptyTitle = "لا توجد بيانات",
  emptyDescription = "لا توجد نتائج للعرض",
  skeletonRows = 5,
  skeletonColumns,
  skeletonHasAvatar = false,
  itemLabel = "عنصر",
}) {
  const colCount = skeletonColumns || columns.length;

  // Loading state
  if (isLoading) {
    return (
      <SkeletonTable
        rows={skeletonRows}
        columns={colCount}
        hasAvatar={skeletonHasAvatar}
      />
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <AlertCircle size={24} />
        </div>
        <h3 className="text-sm font-bold text-rose-800">
          حدث خطأ أثناء تحميل البيانات
        </h3>
        <p className="mt-1 text-xs text-rose-600">
          {error?.message || "يرجى التحقق من اتصال الخادم وإعادة المحاولة"}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary/90 cursor-pointer"
          >
            <RefreshCw size={14} />
            إعادة المحاولة
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          {/* Head */}
          <thead>
            <tr className="border-b border-primary/10 bg-surface/40 text-textSecondary">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-5 py-3.5 font-bold ${col.headerClassName || ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-primary/5">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  {EmptyIcon && (
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-primary">
                      <EmptyIcon size={26} />
                    </div>
                  )}
                  <p className="text-sm font-bold text-text">{emptyTitle}</p>
                  <p className="mt-1 text-xs text-textSecondary">
                    {emptyDescription}
                  </p>
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row[rowKey]}
                  className="transition-colors hover:bg-surface/20"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-5 py-3.5 ${col.className || ""}`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer & Pagination */}
      {pagination && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-primary/10 bg-surface/20 px-5 py-3.5 text-xs text-textSecondary">
          <span>
            عرض{" "}
            <strong className="font-bold text-text">{data.length}</strong> من
            إجمالي{" "}
            <strong className="font-bold text-text">
              {pagination.totalItems}
            </strong>{" "}
            {itemLabel}
          </span>

          {pagination.totalPages > 1 && onPageChange && (
            <div className="flex items-center gap-1.5 self-center">
              <button
                type="button"
                onClick={() =>
                  onPageChange(Math.max(1, pagination.currentPage - 1))
                }
                disabled={!pagination.hasPrev}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary/15 bg-white text-textSecondary transition hover:border-primary hover:text-text disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="الصفحة السابقة"
              >
                <ChevronRight size={15} />
              </button>

              <span className="px-2.5 text-xs font-semibold text-text">
                صفحة {pagination.currentPage} من {pagination.totalPages}
              </span>

              <button
                type="button"
                onClick={() =>
                  onPageChange(
                    Math.min(pagination.totalPages, pagination.currentPage + 1),
                  )
                }
                disabled={!pagination.hasNext}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary/15 bg-white text-textSecondary transition hover:border-primary hover:text-text disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="الصفحة التالية"
              >
                <ChevronLeft size={15} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DataTable;
