import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database } from 'lucide-react';

const SYNTAX_EXAMPLES = [
  { label: 'SQLite', value: 'sqlite:///database.db' },
  { label: 'PostgreSQL', value: 'postgresql://postgres:password@localhost:5432/dbname' },
  { label: 'MySQL', value: 'mysql://root:password@localhost:3306/dbname' },
];

export default function ConnectionScreen({ onConnect, isConnecting, error }) {
  const [connectionString, setConnectionString] = useState('sqlite:///database.db');
  const [connectingDots, setConnectingDots] = useState('');

  useEffect(() => {
    if (!isConnecting) {
      setConnectingDots('');
      return;
    }
    const timer = setInterval(() => {
      setConnectingDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 300);
    return () => clearInterval(timer);
  }, [isConnecting]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!connectionString.trim() || isConnecting) return;
    onConnect(connectionString.trim());
  };

  return (
    <div className="connection-screen-wrapper">
      {/* Top: small logo + "QueryMind" centered */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '28px',
        }}
      >
        <Database size={22} color="var(--primary)" strokeWidth={2.2} />
        <span className="logo-text">QueryMind</span>
      </div>

      {/* Focused Card: max-width 480px, centered */}
      <motion.div
        className="connection-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--text-1)',
              marginBottom: '6px',
            }}
          >
            Connect your database
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              color: 'var(--text-2)',
            }}
          >
            Works with SQLite, PostgreSQL, and MySQL
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <input
              type="text"
              className="connection-input"
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
              placeholder="postgresql://user:pass@localhost:5432/dbname"
              disabled={isConnecting}
              autoFocus
            />

            {/* Ghost chips for syntax examples */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '10px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--text-3)',
                }}
              >
                Presets:
              </span>
              {SYNTAX_EXAMPLES.map((example, idx) => (
                <span key={example.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="ghost-chip"
                    onClick={() => setConnectionString(example.value)}
                  >
                    {example.label}
                  </button>
                  {idx < SYNTAX_EXAMPLES.length - 1 && (
                    <span style={{ color: 'var(--border-2)', fontSize: '12px' }}>|</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Error state: red text below input, IBM Plex Mono */}
          {error && (
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: 'var(--error)',
                lineHeight: '1.5',
                wordBreak: 'break-word',
                padding: '4px 0',
              }}
            >
              {error}
            </div>
          )}

          {/* Connect button */}
          <button
            type="submit"
            className="btn-primary-solid"
            disabled={isConnecting || !connectionString.trim()}
          >
            {isConnecting ? `Connecting${connectingDots}` : 'Connect'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
