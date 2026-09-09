import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

SyntaxHighlighter.registerLanguage('sql', sql);

export default function ResultsPanel({ sqlResult }) {
  const [copied, setCopied] = useState(false);
  const panelRef = useRef(null);

  const { sql = '', results = [], row_count = 0 } = sqlResult || {};

  // Auto smooth-scroll to results when displayed
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [sqlResult]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
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
    // Check first few non-null values
    for (let i = 0; i < Math.min(results.length, 5); i++) {
      const val = results[i]?.[colName];
      if (val !== null && val !== undefined) {
        return typeof val === 'number';
      }
    }
    return false;
  };

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#FFFFFF' }}>
              Generated SQL
            </h3>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontWeight: '600',
              }}
            >
              {row_count} {row_count === 1 ? 'row' : 'rows'} returned
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
              backgroundColor: copied ? 'rgba(0, 255, 136, 0.15)' : 'rgba(42, 42, 58, 0.7)',
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
            background: '#15151F',
          }}
        >
          <SyntaxHighlighter
            language="sql"
            style={atomOneDark}
            customStyle={{
              margin: 0,
              padding: '16px 18px',
              background: '#13131D',
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

      {/* SECTION B — Results Table */}
      <div className="surface-card" style={{ padding: '20px 24px' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#FFFFFF' }}>
              Query Results
            </h3>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(0, 255, 136, 0.12)',
                color: 'var(--success)',
                border: '1px solid rgba(0, 255, 136, 0.25)',
                fontSize: '0.75rem',
                fontWeight: '600',
              }}
            >
              {row_count} {row_count === 1 ? 'row' : 'rows'}
            </span>
          </div>
        </div>

        {/* Results Data Table or Empty State */}
        {results && results.length > 0 ? (
          <div
            style={{
              width: '100%',
              overflowX: 'auto',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              WebkitOverflowScrolling: 'touch',
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
                    backgroundColor: 'rgba(26, 26, 36, 0.95)',
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
                {results.map((row, rowIndex) => (
                  <motion.tr
                    key={rowIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.25,
                      delay: Math.min(rowIndex * 0.05, 1.2), // 50ms stagger per row
                      ease: 'easeOut',
                    }}
                    style={{
                      backgroundColor:
                        rowIndex % 2 === 0 ? 'var(--surface)' : 'rgba(26, 26, 36, 0.5)',
                      borderBottom:
                        rowIndex < results.length - 1 ? '1px solid rgba(42, 42, 58, 0.6)' : 'none',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(108, 99, 255, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        rowIndex % 2 === 0 ? 'var(--surface)' : 'rgba(26, 26, 36, 0.5)';
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
              </tbody>
            </table>
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
              backgroundColor: 'rgba(26, 26, 36, 0.4)',
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
            <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#FFFFFF', marginBottom: '6px' }}>
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
