import { motion } from 'framer-motion';

export default function ConversationThread({ history = [], clarifications = [], status }) {
  if (!history || history.length === 0) {
    return null;
  }

  const isDirectSuccess =
    (status === 'RESULTS' || status === 'GENERATING') && clarifications.length === 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
      }}
    >
      {history.map((msg, index) => {
        const isUser = msg.type === 'user_query' || msg.type === 'user_answer';

        return (
          <motion.div
            key={msg.id || index}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isUser ? 'flex-end' : 'flex-start',
              width: '100%',
            }}
          >
            {/* Header label above bubble */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '5px',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                paddingLeft: isUser ? '0' : '4px',
                paddingRight: isUser ? '4px' : '0',
              }}
            >
              {isUser ? (
                <>
                  <span>You</span>
                  {msg.type === 'user_answer' && msg.turn && (
                    <span style={{ color: 'var(--secondary)' }}>• Clarification #{msg.turn}</span>
                  )}
                </>
              ) : (
                <>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#00D4FF"
                    strokeWidth="2.5"
                  >
                    <path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z" fill="#00D4FF" />
                  </svg>
                  <span>AI Assistant</span>
                  {msg.turn && (
                    <span
                      style={{
                        backgroundColor: 'rgba(255, 184, 0, 0.15)',
                        color: 'var(--warning)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                      }}
                    >
                      Clarification {msg.turn} of 3
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Bubble Content */}
            <div
              style={{
                maxWidth: '85%',
                padding: '12px 18px',
                borderRadius: '16px',
                borderBottomRightRadius: isUser ? '4px' : '16px',
                borderBottomLeftRadius: isUser ? '16px' : '4px',
                background: isUser
                  ? 'linear-gradient(135deg, #6C63FF 0%, #5247DE 100%)'
                  : 'var(--surface-elevated)',
                color: '#FFFFFF',
                border: isUser ? '1px solid rgba(108, 99, 255, 0.4)' : '1px solid var(--border)',
                boxShadow: isUser
                  ? '0 4px 14px rgba(108, 99, 255, 0.25)'
                  : '0 4px 14px rgba(0, 0, 0, 0.2)',
                wordBreak: 'break-word',
                lineHeight: '1.55',
              }}
            >
              <div style={{ fontSize: '0.96rem' }}>{msg.content}</div>

              {/* Optional reason badge for system clarification */}
              {msg.reason && (
                <div
                  style={{
                    marginTop: '8px',
                    paddingTop: '6px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ color: 'var(--warning)', fontWeight: '600' }}>Reason:</span>
                  <span>{msg.reason}</span>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}

      {/* Notice if query was clear immediately */}
      {isDirectSuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            alignSelf: 'center',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(0, 255, 136, 0.1)',
            border: '1px solid rgba(0, 255, 136, 0.25)',
            color: 'var(--success)',
            fontSize: '0.8rem',
            fontWeight: '500',
            marginTop: '4px',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Query is clear and specific — direct SQL execution (no clarification required)</span>
        </motion.div>
      )}
    </div>
  );
}
