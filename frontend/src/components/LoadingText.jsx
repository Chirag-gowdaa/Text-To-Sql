import { useState, useEffect } from 'react';

export default function LoadingText({ status, schema = '' }) {
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4);
    }, 320);
    return () => clearInterval(timer);
  }, []);

  const dots = '.'.repeat(dotCount);
  const baseLabel = status === 'generating' ? 'Generating SQL' : 'Analyzing';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px 0',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          color: 'var(--text-2)',
          letterSpacing: '0.02em',
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
        }}
      >
        <span>{baseLabel}</span>
        <span style={{ minWidth: '24px', textAlign: 'left', color: 'var(--primary)' }}>
          {dots}
        </span>
      </div>

      {status === 'generating' && schema && (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            lineHeight: '1.5',
            color: 'var(--text-3)',
            opacity: 0.55,
            maxHeight: '75px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'pre-wrap',
            userSelect: 'none',
            borderLeft: '1px solid var(--border)',
            paddingLeft: '10px',
          }}
        >
          {schema.slice(0, 320)}
          {schema.length > 320 ? '\n...' : ''}
        </div>
      )}
    </div>
  );
}
