import { motion } from 'framer-motion';

export default function ErrorState({ error, onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      style={{
        backgroundColor: 'rgba(255, 68, 85, 0.08)',
        border: '1px solid rgba(255, 68, 85, 0.4)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 8px 30px rgba(255, 68, 85, 0.12)',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 68, 85, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--error)',
            flexShrink: 0,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#FFFFFF' }}>
            Something went wrong
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.7)' }}>
            The engine encountered an issue while processing your request.
          </p>
        </div>
      </div>

      {/* Error Message */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(10, 10, 15, 0.6)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 68, 85, 0.2)',
          fontSize: '0.88rem',
          color: '#FFA8B0',
          fontFamily: 'var(--font-mono)',
          lineHeight: '1.5',
          wordBreak: 'break-word',
        }}
      >
        {error || 'An unexpected error occurred. Please verify backend connection and try again.'}
      </div>

      {/* Action button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onReset}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: 'var(--error)',
            color: '#FFFFFF',
            fontWeight: '700',
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(255, 68, 85, 0.3)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          <span>Try Again</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
