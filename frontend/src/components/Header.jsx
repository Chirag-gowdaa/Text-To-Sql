import { motion } from 'framer-motion';
import { STATUS } from '../hooks/useQueryFlow';

const STATUS_CONFIG = {
  [STATUS.IDLE]: {
    label: 'Ready',
    color: '#8888AA',
    dotColor: '#555566',
    pulse: false,
  },
  [STATUS.ANALYZING]: {
    label: 'Analyzing Query',
    color: '#6C63FF',
    dotColor: '#6C63FF',
    pulse: true,
  },
  [STATUS.CLARIFYING]: {
    label: 'Awaiting Clarification',
    color: '#FFB800',
    dotColor: '#FFB800',
    pulse: true,
  },
  [STATUS.GENERATING]: {
    label: 'Generating SQL',
    color: '#00D4FF',
    dotColor: '#00D4FF',
    pulse: true,
  },
  [STATUS.RESULTS]: {
    label: 'Results Ready',
    color: '#00FF88',
    dotColor: '#00FF88',
    pulse: false,
  },
  [STATUS.ERROR]: {
    label: 'Error',
    color: '#FF4455',
    dotColor: '#FF4455',
    pulse: false,
  },
};

export default function Header({ status = STATUS.IDLE }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG[STATUS.IDLE];

  return (
    <header className="glass-header" style={{ position: 'sticky', top: 0, zIndex: 50, width: '100%' }}>
      <div
        style={{
          maxWidth: '1120px',
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* Left: Logo + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.25) 0%, rgba(0, 212, 255, 0.2) 100%)',
              border: '1px solid rgba(108, 99, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(108, 99, 255, 0.2)',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00D4FF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Database cylinder */}
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              {/* Sparkle overlay */}
              <path
                d="M17 2l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8z"
                fill="#6C63FF"
                stroke="#6C63FF"
                strokeWidth="1"
              />
            </svg>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px' }}>
            <span
              style={{
                fontSize: '1.18rem',
                fontWeight: '700',
                letterSpacing: '-0.02em',
                color: '#FFFFFF',
              }}
            >
              Text to SQL
            </span>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: '500',
                color: 'var(--text-secondary)',
                letterSpacing: '0.02em',
              }}
            >
              Clarification Engine
            </span>
          </div>
        </div>

        {/* Right: Status badge */}
        <motion.div
          key={status}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '9999px',
            background: 'rgba(26, 26, 36, 0.8)',
            border: `1px solid rgba(42, 42, 58, 0.9)`,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
          }}
        >
          <span
            style={{
              position: 'relative',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: config.dotColor,
              boxShadow: config.pulse ? `0 0 10px ${config.dotColor}` : 'none',
            }}
          >
            {config.pulse && (
              <motion.span
                animate={{ scale: [1, 2.2, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  inset: '-2px',
                  borderRadius: '50%',
                  backgroundColor: config.dotColor,
                  pointerEvents: 'none',
                }}
              />
            )}
          </span>

          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: config.color,
            }}
          >
            {config.label}
          </span>
        </motion.div>
      </div>
    </header>
  );
}
