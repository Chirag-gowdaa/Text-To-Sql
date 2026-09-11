import { useState } from 'react';
import { motion } from 'framer-motion';

const EXAMPLES = [
  {
    type: 'SQLite',
    value: 'sqlite:///database.db',
    desc: 'Local file-based database',
    badgeColor: '#00D4FF',
  },
  {
    type: 'PostgreSQL',
    value: 'postgresql://user:password@localhost:5432/dbname',
    desc: 'Standard Postgres port 5432',
    badgeColor: '#6C63FF',
  },
  {
    type: 'MySQL',
    value: 'mysql+pymysql://user:password@localhost:3306/dbname',
    desc: 'PyMySQL driver port 3306',
    badgeColor: '#FFB800',
  },
];

export default function ConnectionScreen({ onConnect, isConnecting, connectionError }) {
  const [connectionString, setConnectionString] = useState('sqlite:///database.db');

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isConnecting || !connectionString.trim()) return;
    onConnect(connectionString.trim());
  };

  const handleChipClick = (val) => {
    setConnectionString(val);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      style={{
        maxWidth: '680px',
        width: '100%',
        margin: '20px auto 40px',
      }}
    >
      {/* Intro Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background:
              'linear-gradient(135deg, rgba(108, 99, 255, 0.25) 0%, rgba(0, 212, 255, 0.2) 100%)',
            border: '1px solid rgba(108, 99, 255, 0.4)',
            boxShadow: '0 0 28px rgba(108, 99, 255, 0.25)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <svg
            width="32"
            height="32"
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
        </motion.div>

        <h2
          style={{
            fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)',
            fontWeight: '800',
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            marginBottom: '8px',
          }}
        >
          Connect Your Database
        </h2>

        <p
          style={{
            fontSize: '0.94rem',
            color: 'var(--text-secondary)',
            maxWidth: '520px',
            margin: '0 auto',
            lineHeight: '1.5',
          }}
        >
          Enter your database URI to inspect schema, detect query ambiguities, and run
          clarified SQL against real tables.
        </p>
      </div>

      {/* Connection Card */}
      <div className="surface-card" style={{ padding: '28px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}
            >
              Database Connection String (URI)
            </label>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={connectionString}
                onChange={(e) => setConnectionString(e.target.value)}
                disabled={isConnecting}
                placeholder="e.g. sqlite:///database.db"
                className="input-glow-focus"
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  backgroundColor: 'var(--surface-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.96rem',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Error Message Below Input */}
            {connectionError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginTop: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 68, 85, 0.12)',
                  border: '1px solid rgba(255, 68, 85, 0.35)',
                  color: '#FFA8B0',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FF4455"
                  strokeWidth="2.2"
                  style={{ flexShrink: 0, marginTop: '2px' }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span style={{ wordBreak: 'break-word', lineHeight: '1.45' }}>
                  {connectionError}
                </span>
              </motion.div>
            )}
          </div>

          {/* Quick Examples */}
          <div style={{ marginBottom: '24px' }}>
            <span
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                marginBottom: '10px',
              }}
            >
              Supported Connection Examples
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {EXAMPLES.map((item) => (
                <motion.div
                  key={item.type}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleChipClick(item.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--surface-elevated)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = item.badgeColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        color: item.badgeColor,
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        flexShrink: 0,
                      }}
                    >
                      {item.type}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.82rem',
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.value}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      marginLeft: '12px',
                      flexShrink: 0,
                    }}
                  >
                    Use sample ↵
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Connect Button */}
          <motion.button
            type="submit"
            whileHover={!isConnecting && connectionString.trim() ? { scale: 1.02 } : {}}
            whileTap={!isConnecting && connectionString.trim() ? { scale: 0.98 } : {}}
            disabled={isConnecting || !connectionString.trim()}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: '12px',
              border: 'none',
              background:
                !isConnecting && connectionString.trim()
                  ? 'linear-gradient(135deg, #6C63FF 0%, #00D4FF 100%)'
                  : 'linear-gradient(135deg, #37335C 0%, #203A43 100%)',
              color: '#FFFFFF',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: !isConnecting && connectionString.trim() ? 'pointer' : 'not-allowed',
              opacity: !isConnecting && connectionString.trim() ? 1 : 0.65,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow:
                !isConnecting && connectionString.trim()
                  ? '0 4px 20px rgba(108, 99, 255, 0.4), 0 0 20px rgba(0, 212, 255, 0.2)'
                  : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {isConnecting ? (
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
                <span>Connecting to database...</span>
              </>
            ) : (
              <>
                <span>Connect Database</span>
                <span style={{ fontSize: '1.15rem' }}>→</span>
              </>
            )}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
