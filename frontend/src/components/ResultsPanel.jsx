import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

SyntaxHighlighter.registerLanguage('sql', sql);

/**
 * Animated counter that counts up to the query execution time in ms or seconds over 600ms.
 */
function AnimatedExecutionTime({ timeMs }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime = null;
    const duration = 600;
    const target = Math.max(0, timeMs || 0);
    let animationFrame;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(eased * target);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      }
    };

    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [timeMs]);

  const formatted =
    displayValue < 1000
      ? `${Math.round(displayValue)}ms`
      : `${(displayValue / 1000).toFixed(2)}s`;

  return <span>{formatted}</span>;
}

export default function ResultsPanel({
  sqlResult,
  onChangePage,
  isPaginating = false,
}) {
  const [copied, setCopied] = useState(false);
  const panelRef = useRef(null);

  const {
    sql = '',
    results = [],
    row_count = 0,
    total_count = 0,
    current_page = 1,
    total_pages = 1,
    limit = 20,
    offset = 0,
    executionTimeMs,
  } = sqlResult || {};

  // Auto smooth-scroll to results when displayed
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [sqlResult?.sql]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const columns = results && results.length > 0 ? Object.keys(results[0]) : [];

  const formatCellValue = (val) => {
    if (val === null || val === undefined) {
      return <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>null</span>;
    }
    if (typeof val === 'number') {
      return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    if (typeof val === 'boolean') {
      return val ? 'true' : 'false';
    }
    if (typeof val === 'object') {
      return JSON.stringify(val);
    }
    return String(val);
  };

  const isNumericColumn = (colName) => {
    if (!results || results.length === 0) return false;
    for (let i = 0; i < Math.min(results.length, 5); i++) {
      const val = results[i]?.[colName];
      if (val !== null && val !== undefined) {
        return typeof val === 'number';
      }
    }
    return false;
  };

  // Pagination bounds calculation
  const effectiveTotal = total_count > 0 ? total_count : row_count;
  const startRow = effectiveTotal === 0 ? 0 : offset + 1;
  const endRow = Math.min(offset + row_count, effectiveTotal);
  const isFirstPage = current_page <= 1;
  const isLastPage = current_page >= total_pages;

  const PAGE_SIZES = [10, 20, 50];

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '100%',
      }}
    >
      {/* SECTION A — Generated SQL */}
      <div
        className="surface-card"
        style={{
          borderLeft: '4px solid var(--primary)',
          position: 'relative',
          padding: '20px 24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(108, 99, 255, 0.2)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Generated SQL
            </h3>

            {/* Row count & Execution Time Badge */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'var(--surface-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: '600',
              }}
            >
              <span>{effectiveTotal} {effectiveTotal === 1 ? 'row' : 'rows'}</span>
              {executionTimeMs !== undefined && (
                <>
                  <span style={{ color: 'var(--text-muted)' }}>·</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    <AnimatedExecutionTime timeMs={executionTimeMs} />
                  </span>
                </>
              )}
            </span>
          </div>

          {/* Copy Button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: copied ? 'rgba(0, 255, 136, 0.15)' : 'var(--surface-elevated)',
              border: copied ? '1px solid var(--success)' : '1px solid var(--border)',
              color: copied ? 'var(--success)' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>Copy SQL</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Syntax Highlighter Container */}
        <div
          style={{
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            background: 'var(--code-bg, #13131D)',
          }}
        >
          <SyntaxHighlighter
            language="sql"
            style={atomOneDark}
            customStyle={{
              margin: 0,
              padding: '16px 18px',
              background: 'transparent',
              fontSize: '0.9rem',
              lineHeight: '1.6',
              fontFamily: 'var(--font-mono)',
            }}
            wrapLongLines={true}
          >
            {sql || '-- No SQL generated'}
          </SyntaxHighlighter>
        </div>
      </div>

      {/* SECTION B — Results Table & Pagination */}
      <div className="surface-card" style={{ padding: '20px 24px' }}>
        {/* Table Header Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(0, 212, 255, 0.2)',
                color: 'var(--secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Query Results
            </h3>

            {/* Row Count Badge + Execution Time */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(0, 255, 136, 0.12)',
                color: 'var(--success)',
                border: '1px solid rgba(0, 255, 136, 0.25)',
                fontSize: '0.75rem',
                fontWeight: '600',
              }}
            >
              <span>{effectiveTotal} {effectiveTotal === 1 ? 'row' : 'rows'}</span>
              {executionTimeMs !== undefined && (
                <>
                  <span>·</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    <AnimatedExecutionTime timeMs={executionTimeMs} />
                  </span>
                </>
              )}
            </span>
          </div>

          {/* Showing X-Y of Z results text above table */}
          {effectiveTotal > 0 && (
            <div
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                fontWeight: '500',
              }}
            >
              Showing <strong style={{ color: 'var(--text-primary)' }}>{startRow}-{endRow}</strong> of{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{effectiveTotal}</strong> results
            </div>
          )}
        </div>

        {/* Results Data Table */}
        {results && results.length > 0 ? (
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: '100%',
                overflowX: 'auto',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                WebkitOverflowScrolling: 'touch',
                opacity: isPaginating ? 0.45 : 1,
                transition: 'opacity 0.2s ease',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '0.88rem',
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: 'var(--surface-elevated)',
                      borderBottom: '2px solid var(--border)',
                    }}
                  >
                    {columns.map((col) => {
                      const isNum = isNumericColumn(col);
                      return (
                        <th
                          key={col}
                          style={{
                            padding: '12px 16px',
                            color: 'var(--text-secondary)',
                            fontWeight: '700',
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.07em',
                            textAlign: isNum ? 'right' : 'left',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {col.replace(/_/g, ' ')}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="wait">
                    {results.map((row, rowIndex) => (
                      <motion.tr
                        key={`${current_page}-${rowIndex}`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.2,
                          delay: Math.min(rowIndex * 0.03, 0.5),
                          ease: 'easeOut',
                        }}
                        style={{
                          backgroundColor:
                            rowIndex % 2 === 0 ? 'var(--surface)' : 'var(--zebra-bg)',
                          borderBottom:
                            rowIndex < results.length - 1 ? '1px solid var(--border)' : 'none',
                        }}
                      >
                        {columns.map((col) => {
                          const isNum = isNumericColumn(col);
                          return (
                            <td
                              key={col}
                              style={{
                                padding: '12px 16px',
                                color: 'var(--text-primary)',
                                textAlign: isNum ? 'right' : 'left',
                                fontFamily: isNum ? 'var(--font-mono)' : 'inherit',
                                fontSize: isNum ? '0.86rem' : '0.88rem',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {formatCellValue(row[col])}
                            </td>
                          );
                        })}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Row */}
            {onChangePage && (
              <div
                style={{
                  marginTop: '18px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px',
                }}
              >
                {/* Rows per page selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Rows per page:
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {PAGE_SIZES.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => onChangePage(1, size)}
                        disabled={isPaginating}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: '600',
                          border: '1px solid',
                          borderColor: limit === size ? 'var(--primary)' : 'var(--border)',
                          backgroundColor:
                            limit === size ? 'rgba(108, 99, 255, 0.15)' : 'var(--surface-elevated)',
                          color: limit === size ? 'var(--primary)' : 'var(--text-secondary)',
                          cursor: isPaginating ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Page Navigation Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {/* First Page */}
                  <motion.button
                    type="button"
                    whileHover={!isFirstPage && !isPaginating ? { scale: 1.05 } : {}}
                    whileTap={!isFirstPage && !isPaginating ? { scale: 0.95 } : {}}
                    onClick={() => onChangePage(1, limit)}
                    disabled={isFirstPage || isPaginating}
                    title="First page"
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--surface-elevated)',
                      border: '1px solid var(--border)',
                      color: isFirstPage || isPaginating ? 'var(--text-muted)' : 'var(--text-primary)',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: isFirstPage || isPaginating ? 'not-allowed' : 'pointer',
                      opacity: isFirstPage || isPaginating ? 0.5 : 1,
                    }}
                  >
                    « First
                  </motion.button>

                  {/* Previous Page */}
                  <motion.button
                    type="button"
                    whileHover={!isFirstPage && !isPaginating ? { scale: 1.05 } : {}}
                    whileTap={!isFirstPage && !isPaginating ? { scale: 0.95 } : {}}
                    onClick={() => onChangePage(current_page - 1, limit)}
                    disabled={isFirstPage || isPaginating}
                    title="Previous page"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--surface-elevated)',
                      border: '1px solid var(--border)',
                      color: isFirstPage || isPaginating ? 'var(--text-muted)' : 'var(--text-primary)',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: isFirstPage || isPaginating ? 'not-allowed' : 'pointer',
                      opacity: isFirstPage || isPaginating ? 0.5 : 1,
                    }}
                  >
                    ‹ Prev
                  </motion.button>

                  {/* Page indicator */}
                  <span
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    Page {current_page} of {total_pages}
                  </span>

                  {/* Next Page */}
                  <motion.button
                    type="button"
                    whileHover={!isLastPage && !isPaginating ? { scale: 1.05 } : {}}
                    whileTap={!isLastPage && !isPaginating ? { scale: 0.95 } : {}}
                    onClick={() => onChangePage(current_page + 1, limit)}
                    disabled={isLastPage || isPaginating}
                    title="Next page"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--surface-elevated)',
                      border: '1px solid var(--border)',
                      color: isLastPage || isPaginating ? 'var(--text-muted)' : 'var(--text-primary)',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: isLastPage || isPaginating ? 'not-allowed' : 'pointer',
                      opacity: isLastPage || isPaginating ? 0.5 : 1,
                    }}
                  >
                    Next ›
                  </motion.button>

                  {/* Last Page */}
                  <motion.button
                    type="button"
                    whileHover={!isLastPage && !isPaginating ? { scale: 1.05 } : {}}
                    whileTap={!isLastPage && !isPaginating ? { scale: 0.95 } : {}}
                    onClick={() => onChangePage(total_pages, limit)}
                    disabled={isLastPage || isPaginating}
                    title="Last page"
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--surface-elevated)',
                      border: '1px solid var(--border)',
                      color: isLastPage || isPaginating ? 'var(--text-muted)' : 'var(--text-primary)',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: isLastPage || isPaginating ? 'not-allowed' : 'pointer',
                      opacity: isLastPage || isPaginating ? 0.5 : 1,
                    }}
                  >
                    Last »
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div
            style={{
              padding: '48px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--surface-elevated)',
              borderRadius: '10px',
              border: '1px dashed var(--border)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
                color: 'var(--text-muted)',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
              No results found
            </h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '340px' }}>
              The query was executed successfully against the database, but returned 0 rows.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
