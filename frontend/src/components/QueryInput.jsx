import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { STATUS } from '../hooks/useQueryFlow';

const EXAMPLE_QUERIES = [
  'show me top customers',
  'recent orders this week',
  'which products are low on stock',
  'show me top 5 customers by revenue this month',
];

export default function QueryInput({
  status,
  originalQuery,
  onSubmit,
}) {
  const [query, setQuery] = useState('');
  const textareaRef = useRef(null);

  const isBusy = status === STATUS.ANALYZING || status === STATUS.GENERATING;
  const isLocked = status === STATUS.CLARIFYING || status === STATUS.RESULTS;

  // Auto-expand textarea height
  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.max(el.scrollHeight, 88)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [query]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isBusy || !query.trim()) return;
    onSubmit(query.trim());
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChipClick = (example) => {
    if (isBusy) return;
    setQuery(example);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="surface-card" style={{ position: 'relative', width: '100%' }}>
      {/* Read-only badge when in CLARIFYING or RESULTS state */}
      {isLocked && originalQuery && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: '16px',
            padding: '8px 14px',
            borderRadius: '8px',
            backgroundColor: 'var(--surface-elevated)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.85rem',
          }}
        >
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: 'rgba(108, 99, 255, 0.2)',
              color: 'var(--primary)',
              border: '1px solid rgba(108, 99, 255, 0.3)',
            }}
          >
            Active Query
          </span>
          <span
            style={{
              color: 'var(--text-primary)',
              fontStyle: 'italic',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            "{originalQuery}"
          </span>
        </motion.div>
      )}

      {/* Query Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ position: 'relative', marginBottom: '14px' }}>
          <textarea
            ref={textareaRef}
            rows={3}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
            placeholder="Ask anything about your data... e.g. show me top customers by revenue"
            className="input-glow-focus"
            style={{
              width: '100%',
              minHeight: '92px',
              maxHeight: '260px',
              padding: '16px 18px 36px 18px',
              backgroundColor: 'var(--surface-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              lineHeight: '1.6',
              resize: 'none',
              boxSizing: 'border-box',
            }}
          />

          {/* Character counter & keyboard hint */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                backgroundColor: 'rgba(17, 17, 24, 0.7)',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              Ctrl + Enter ↵
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {query.length} chars
            </span>
          </div>
        </div>

        {/* Examples Chips Row */}
        <div style={{ marginBottom: '18px' }}>
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>Try these examples:</span>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            {EXAMPLE_QUERIES.map((example) => (
              <motion.button
                key={example}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleChipClick(example)}
                disabled={isBusy}
                style={{
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  borderRadius: '20px',
                  padding: '6px 12px',
                  fontSize: '0.82rem',
                  cursor: isBusy ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                "{example}"
              </motion.button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          whileHover={!isBusy && query.trim() ? { scale: 1.02 } : {}}
          whileTap={!isBusy && query.trim() ? { scale: 0.98 } : {}}
          disabled={isBusy || !query.trim()}
          style={{
            width: '100%',
            padding: '14px 24px',
            borderRadius: '12px',
            border: 'none',
            background:
              !isBusy && query.trim()
                ? 'linear-gradient(135deg, #6C63FF 0%, #00D4FF 100%)'
                : 'linear-gradient(135deg, #37335C 0%, #203A43 100%)',
            color: '#FFFFFF',
            fontSize: '1rem',
            fontWeight: '700',
            letterSpacing: '0.01em',
            cursor: !isBusy && query.trim() ? 'pointer' : 'not-allowed',
            opacity: !isBusy && query.trim() ? 1 : 0.65,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow:
              !isBusy && query.trim()
                ? '0 4px 20px rgba(108, 99, 255, 0.4), 0 0 20px rgba(0, 212, 255, 0.2)'
                : 'none',
            transition: 'background 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease',
          }}
        >
          {isBusy ? (
            <>
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTopColor: '#FFFFFF',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>Analyze Query</span>
              <span style={{ fontSize: '1.15rem' }}>→</span>
            </>
          )}
        </motion.button>
      </form>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
