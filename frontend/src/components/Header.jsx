import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { STATUS } from '../hooks/useQueryFlow';

const STATUS_CONFIG = {
  [STATUS.IDLE]: {
    label: 'Ready',
    color: 'var(--text-secondary)',
    dotColor: 'var(--text-muted)',
    pulse: false,
  },
  [STATUS.ANALYZING]: {
    label: 'Analyzing Query',
    color: 'var(--primary)',
    dotColor: 'var(--primary)',
    pulse: true,
  },
  [STATUS.CLARIFYING]: {
    label: 'Clarification Needed',
    color: 'var(--warning)',
    dotColor: 'var(--warning)',
    pulse: true,
  },
  [STATUS.GENERATING]: {
    label: 'Generating SQL',
    color: 'var(--secondary)',
    dotColor: 'var(--secondary)',
    pulse: true,
  },
  [STATUS.RESULTS]: {
    label: 'Results Ready',
    color: 'var(--success)',
    dotColor: 'var(--success)',
    pulse: false,
  },
  [STATUS.ERROR]: {
    label: 'Error',
    color: 'var(--error)',
    dotColor: 'var(--error)',
    pulse: false,
  },
};

export default function Header({
  status = STATUS.IDLE,
  isConnected = false,
  connectionString = '',
  onDisconnect,
}) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('tts_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tts_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const config = STATUS_CONFIG[status] || STATUS_CONFIG[STATUS.IDLE];

  // Helper to get friendly dialect name
  const getDialectBadge = (uri) => {
    if (!uri) return null;
    if (uri.startsWith('sqlite')) return 'SQLite';
    if (uri.startsWith('postgres')) return 'PostgreSQL';
    if (uri.startsWith('mysql')) return 'MySQL';
    return 'Database';
  };

  const dialect = getDialectBadge(connectionString);

  return (
    <header className="glass-header" style={{ position: 'sticky', top: 0, zIndex: 50, width: '100%' }}>
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '14px 24px',
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
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
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
                color: 'var(--text-primary)',
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

        {/* Right Section: Connected indicator, Status, Disconnect, Theme Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {isConnected ? (
            <>
              {/* Connected Indicator */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(0, 255, 136, 0.08)',
                  border: '1px solid rgba(0, 255, 136, 0.25)',
                }}
              >
                <span
                  style={{
                    position: 'relative',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--success)',
                    boxShadow: '0 0 8px var(--success)',
                  }}
                >
                  <motion.span
                    animate={{ scale: [1, 2, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute',
                      inset: '-2px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--success)',
                      pointerEvents: 'none',
                    }}
                  />
                </span>

                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    color: 'var(--success)',
                    letterSpacing: '0.04em',
                  }}
                >
                  Connected
                </span>

                {dialect && (
                  <span
                    style={{
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      fontSize: '0.68rem',
                      fontWeight: '700',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {dialect}
                  </span>
                )}
              </div>

              {/* Engine State Badge */}
              <motion.div
                key={status}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border)',
                }}
              >
                <span
                  style={{
                    position: 'relative',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: config.dotColor,
                    boxShadow: config.pulse ? `0 0 8px ${config.dotColor}` : 'none',
                  }}
                />
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: config.color,
                  }}
                >
                  {config.label}
                </span>
              </motion.div>

              {/* Disconnect Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onDisconnect}
                title="Disconnect database session"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 68, 85, 0.12)',
                  border: '1px solid rgba(255, 68, 85, 0.3)',
                  color: 'var(--error)',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                  <line x1="12" y1="2" x2="12" y2="12" />
                </svg>
                <span>Disconnect</span>
              </motion.button>
            </>
          ) : (
            /* When disconnected: simple Not Connected status */
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: 'var(--surface-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--text-muted)',
                }}
              />
              <span>Not Connected</span>
            </div>
          )}

          {/* Theme Toggle Button (Dark / Light) */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              color: theme === 'dark' ? '#FFB800' : '#6C63FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              marginLeft: '4px',
            }}
          >
            <motion.div
              key={theme}
              initial={{ rotate: -180, scale: 0.7 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {theme === 'dark' ? (
                /* Moon Icon for dark mode */
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                /* Sun Icon for light mode */
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </motion.div>
          </motion.button>
        </div>
      </div>
    </header>
  );
}
