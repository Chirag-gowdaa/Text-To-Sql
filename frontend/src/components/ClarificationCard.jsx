import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function ClarificationCard({
  question,
  reason,
  turn = 1,
  confidence = 0.5,
  onSubmitAnswer,
}) {
  const [answer, setAnswer] = useState('');
  const cardRef = useRef(null);
  const inputRef = useRef(null);

  // Smooth scroll into view when card appears
  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // Auto-focus input
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 250);
    return () => clearTimeout(timer);
  }, [question, turn]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!answer.trim()) return;
    onSubmitAnswer(answer.trim());
    setAnswer('');
  };

  // Format confidence as percentage (0 - 100)
  const confidencePct = Math.round(
    confidence <= 1 ? Math.max(0, Math.min(1, confidence)) * 100 : Math.min(100, confidence)
  );

  // Confidence color mapping
  let confidenceColor = '#FF4455'; // red
  let confidenceLevel = 'Low';
  if (confidencePct >= 70) {
    confidenceColor = '#00FF88'; // green
    confidenceLevel = 'High';
  } else if (confidencePct >= 40) {
    confidenceColor = '#FFB800'; // yellow
    confidenceLevel = 'Moderate';
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      style={{
        backgroundColor: 'var(--surface-elevated)',
        border: '1px solid rgba(255, 184, 0, 0.4)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35), 0 0 25px rgba(255, 184, 0, 0.1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Warning Badge & Heading */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 184, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--warning)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h3
            style={{
              fontSize: '1.05rem',
              fontWeight: '700',
              color: 'var(--warning)',
              letterSpacing: '-0.01em',
            }}
          >
            Clarification Needed
          </h3>
        </div>

        {/* Turn pill */}
        <span
          style={{
            padding: '3px 10px',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: '600',
            backgroundColor: 'rgba(255, 184, 0, 0.12)',
            color: 'var(--warning)',
            border: '1px solid rgba(255, 184, 0, 0.25)',
          }}
        >
          Turn {turn} of 3
        </span>
      </div>

      {/* Clarification Question */}
      <div
        style={{
          fontSize: '1.18rem',
          fontWeight: '600',
          color: 'var(--text-primary)',
          lineHeight: '1.45',
          marginBottom: reason ? '8px' : '18px',
        }}
      >
        {question}
      </div>

      {/* Ambiguity Reason */}
      {reason && (
        <div
          style={{
            fontSize: '0.84rem',
            color: 'var(--text-secondary)',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>Why:</span>
          <span>{reason}</span>
        </div>
      )}

      {/* Answer Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexDirection: 'row',
            alignItems: 'stretch',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer... (e.g. by revenue, or last 30 days)"
            className="input-glow-focus"
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          />

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={!answer.trim()}
            style={{
              padding: '12px 22px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: answer.trim() ? '#00D4FF' : '#1F3C47',
              color: answer.trim() ? '#0A0A0F' : '#5C7E8A',
              fontWeight: '700',
              fontSize: '0.92rem',
              cursor: answer.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              boxShadow: answer.trim() ? '0 0 16px rgba(0, 212, 255, 0.4)' : 'none',
              transition: 'background-color 0.2s, box-shadow 0.2s, color 0.2s',
            }}
          >
            <span>Submit</span>
            <span>↵</span>
          </motion.button>
        </div>
      </form>

      {/* Footer Info: Turn Helper Text & Confidence Meter */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.07)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <span>Turn {turn} of 3 — helping me write accurate SQL</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Query Confidence:</span>
            <span style={{ color: confidenceColor, fontWeight: '700' }}>
              {confidencePct}% ({confidenceLevel})
            </span>
          </div>
        </div>

        {/* Confidence Meter Bar */}
        <div
          style={{
            width: '100%',
            height: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '9999px',
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidencePct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              height: '100%',
              backgroundColor: confidenceColor,
              borderRadius: '9999px',
              boxShadow: `0 0 8px ${confidenceColor}`,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
