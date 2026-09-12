import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
  limit = 20,
  currentRowsCount = 0,
  onPageChange,
  onLimitChange,
}) {
  const startRow = totalCount === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endRow = Math.min(totalCount, (currentPage - 1) * limit + currentRowsCount);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        paddingTop: '16px',
        borderTop: '1px solid var(--border)',
      }}
    >
      {/* "Showing 41–60 of 234 results" in --text-3 */}
      <div
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '12px',
          color: 'var(--text-3)',
        }}
      >
        Showing {startRow}–{endRow} of {totalCount} results
      </div>

      {/* Center / Right controls: Page size select, Prev / Next, page counter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Page size selector as minimal inline select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            value={limit}
            onChange={(e) => onLimitChange?.(Number(e.target.value))}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-2)',
              color: 'var(--text-2)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              padding: '4px 8px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value={10} style={{ background: 'var(--surface-2)', color: 'var(--text-1)' }}>
              10 per page
            </option>
            <option value={20} style={{ background: 'var(--surface-2)', color: 'var(--text-1)' }}>
              20 per page
            </option>
            <option value={50} style={{ background: 'var(--surface-2)', color: 'var(--text-1)' }}>
              50 per page
            </option>
            <option value={100} style={{ background: 'var(--surface-2)', color: 'var(--text-1)' }}>
              100 per page
            </option>
          </select>
        </div>

        {/* Current page indicator + Prev / Next */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="ghost-action-btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            style={{
              opacity: currentPage <= 1 ? 0.35 : 1,
              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronLeft size={14} />
            <span>Previous</span>
          </button>

          {/* Current page indicator: "3 / 12" in IBM Plex Mono */}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--text-1)',
              padding: '0 4px',
              userSelect: 'none',
            }}
          >
            {currentPage} / {totalPages || 1}
          </span>

          <button
            type="button"
            className="ghost-action-btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            style={{
              opacity: currentPage >= totalPages ? 0.35 : 1,
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            }}
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
