import { motion } from 'framer-motion';
import { STATUS } from '../hooks/useQueryFlow';

export default function LoadingState({ status }) {
  const isAnalyzing = status === STATUS.ANALYZING;
  const isGenerating = status === STATUS.GENERATING;

  if (!isAnalyzing && !isGenerating) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.25 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 20px',
        width: '100%',
      }}
    >
      {/* Custom Animated Ring with Purple Glow */}
      <div
        style={{
          position: 'relative',
          width: '64px',
          height: '64px',
          marginBottom: '20px',
        }}
      >
        {/* Ambient background glow */}
        <div
          style={{
            position: 'absolute',
            inset: '-6px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(108, 99, 255, 0.4) 0%, rgba(108, 99, 255, 0) 70%)',
            filter: 'blur(8px)',
          }}
        />

        {/* Static track */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px solid rgba(108, 99, 255, 0.15)',
          }}
        />

        {/* Spinning glowing ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: '#6C63FF',
            borderRightColor: '#00D4FF',
            boxShadow: '0 0 15px rgba(108, 99, 255, 0.5)',
          }}
        />

        {/* Center icon / beacon */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
          }}
        >
          {isAnalyzing ? '🔍' : '⚡'}
        </div>
      </div>

      {/* Main loading label with pulsing dots */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '1.08rem',
          fontWeight: '600',
          color: '#FFFFFF',
          letterSpacing: '-0.01em',
        }}
      >
        <span>{isAnalyzing ? 'Analyzing your query' : 'Generating SQL'}</span>
        <span style={{ display: 'inline-flex', gap: '2px', marginLeft: '2px' }}>
          <span className="dot-1" style={{ color: 'var(--primary)' }}>•</span>
          <span className="dot-2" style={{ color: 'var(--secondary)' }}>•</span>
          <span className="dot-3" style={{ color: 'var(--primary)' }}>•</span>
        </span>
      </div>

      {/* Helper description */}
      <p
        style={{
          marginTop: '8px',
          fontSize: '0.84rem',
          color: 'var(--text-secondary)',
          textAlign: 'center',
        }}
      >
        {isAnalyzing
          ? 'Inspecting database schema for ambiguities & clarification triggers'
          : 'Translating intent into verified SQL and querying the database'}
      </p>
    </motion.div>
  );
}
