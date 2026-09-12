import { useState, useRef, useEffect } from 'react';

const EXAMPLE_QUERIES = [
  'Top 5 customers by total spend',
  'Orders placed in the last 30 days',
  'Products with inventory under 15 units',
  'Monthly revenue summary for this year',
];

export default function QueryInput({ onSubmit, disabled, initialValue = '' }) {
  const [query, setQuery] = useState(initialValue);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (initialValue) {
      setQuery(initialValue);
    }
  }, [initialValue]);

  const handleInput = (e) => {
    setQuery(e.target.value);
    // Auto-expand textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(80, textareaRef.current.scrollHeight)}px`;
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Cmd+Enter or Ctrl+Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
  };

  const handleSelectExample = (exampleText) => {
    setQuery(exampleText);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      {/* Large auto-expanding textarea: IBM Plex Mono 14px */}
      <textarea
        ref={textareaRef}
        className="query-textarea"
        rows={2}
        value={query}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything about your data..."
        disabled={disabled}
      />

      {/* Row below textarea: Example chips on left, Submit button + keyboard hint on right */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* 4 Example query chips */}
        <div className="query-examples-row">
          {EXAMPLE_QUERIES.map((example) => (
            <button
              key={example}
              type="button"
              className="query-chip"
              onClick={() => handleSelectExample(example)}
              disabled={disabled}
            >
              {example}
            </button>
          ))}
        </div>

        {/* Submit button right-aligned with keyboard hint */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-3)',
              userSelect: 'none',
            }}
          >
            ⌘↵
          </span>
          <button
            type="button"
            className="btn-run-query"
            onClick={handleSubmit}
            disabled={disabled || !query.trim()}
          >
            Run query
          </button>
        </div>
      </div>
    </div>
  );
}
