import { motion } from 'framer-motion';
import ClarificationBubble from './ClarificationBubble';

export default function ConversationThread({
  history = [],
  status,
  currentQuestion,
  confidence,
  onSubmitClarification,
}) {
  if (history.length === 0 && !currentQuestion) {
    return null;
  }

  return (
    <div className="thread-container">
      {history.map((item, index) => {
        if (item.type === 'user') {
          return (
            <motion.div
              key={item.id || `u-${index}`}
              className="bubble-user"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {item.text}
            </motion.div>
          );
        }

        if (item.type === 'system') {
          // Check if this system question was already answered in history
          const nextItem = history[index + 1];
          const isAnswered = nextItem && nextItem.type === 'answer';

          return (
            <ClarificationBubble
              key={item.id || `s-${index}`}
              question={item.text}
              confidence={item.confidence ?? 0.65}
              isAnswered={Boolean(isAnswered)}
              answerText={isAnswered ? nextItem.text : ''}
              onSubmitAnswer={onSubmitClarification}
            />
          );
        }

        // 'answer' entries are rendered inside the paired ClarificationBubble
        return null;
      })}

      {/* If currently in clarifying state and question not yet in history */}
      {status === 'clarifying' &&
        currentQuestion &&
        !history.some((h) => h.type === 'system' && h.text === currentQuestion) && (
          <ClarificationBubble
            key="active-clarification"
            question={currentQuestion}
            confidence={confidence ?? 0.65}
            isAnswered={false}
            onSubmitAnswer={onSubmitClarification}
          />
        )}
    </div>
  );
}
