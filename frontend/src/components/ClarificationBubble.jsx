import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ClarificationBubble({
  question,
  confidence = 0.65,
  onSubmitAnswer,
  isAnswered,
  answerText,
}) {
  const [answer, setAnswer] = useState('');

  const percent = Math.min(100, Math.max(0, Math.round(confidence * 100)));

  // Low = --error, Medium = --warning, High = --accent
  let barColor = 'var(--accent)';
  if (percent < 45) {
    barColor = 'var(--error)';
  } else if (percent < 75) {
    barColor = 'var(--warning)';
  }

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!answer.trim() || isAnswered) return;
    onSubmitAnswer(answer.trim());
    setAnswer('');
  };

  return (
    <motion.div
      className="bubble-system"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Tiny muted label "Needs clarification" */}
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '11px',
          fontWeight: 500,
          color: 'var(--text-3)',
          letterSpacing: '0.04em',
        }}
      >
        Needs clarification
      </span>

      {/* Question text in Inter 14px */}
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          lineHeight: '1.6',
          color: 'var(--text-1)',
        }}
      >
        {question}
      </p>

      {/* Confidence bar: thin 4px horizontal bar, animated width from 0 to final, tooltip on hover */}
      <div
        className="confidence-track"
        title={`Query confidence: ${percent}%`}
      >
        <motion.div
          className="confidence-fill"
          style={{ backgroundColor: barColor }}
          initial={{ width: '0%' }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {/* Answer Input or Answered State */}
      {!isAnswered ? (
        <form onSubmit={handleSubmit} className="clarification-input-row">
          <input
            type="text"
            className="clarification-input"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Your answer..."
            autoFocus
          />
          <button
            type="submit"
            className="clarification-submit-btn"
            disabled={!answer.trim()}
            title="Submit answer (Enter)"
          >
            ↵
          </button>
        </form>
      ) : (
        <div
          style={{
            marginTop: '4px',
            padding: '6px 10px',
            backgroundColor: 'var(--surface-3)',
            borderLeft: '2px solid var(--border-2)',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--text-2)',
          }}
        >
          <span style={{ color: 'var(--text-3)', marginRight: '6px' }}>↳</span>
          {answerText}
        </div>
      )}
    </motion.div>
  );
}
