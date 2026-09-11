import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryFlow, STATUS } from './hooks/useQueryFlow';
import Header from './components/Header';
import ConnectionScreen from './components/ConnectionScreen';
import SchemaViewer from './components/SchemaViewer';
import QueryInput from './components/QueryInput';
import ConversationThread from './components/ConversationThread';
import ClarificationCard from './components/ClarificationCard';
import LoadingState from './components/LoadingState';
import ResultsPanel from './components/ResultsPanel';
import ErrorState from './components/ErrorState';

export default function App() {
  const {
    status,
    originalQuery,
    clarifications,
    currentQuestion,
    turn,
    confidence,
    reason,
    sqlResult,
    error,
    history,
    // Database connection & session
    schema,
    connectionString,
    isConnected,
    isConnecting,
    connectionError,
    isPaginating,
    connectDb,
    disconnectDb,
    submitQuery,
    submitClarification,
    changePage,
    reset,
  } = useQueryFlow();

  const [isSchemaCollapsed, setIsSchemaCollapsed] = useState(false);

  const showReset = status === STATUS.CLARIFYING || status === STATUS.RESULTS;

  return (
    <div className="app-layout">
      {/* Subtle Animated Ambient Background Blobs */}
      <div className="ambient-bg" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      {/* Glassmorphic Sticky Header with Theme Toggle & Connection Indicator */}
      <Header
        status={status}
        isConnected={isConnected}
        connectionString={connectionString}
        onDisconnect={disconnectDb}
      />

      {/* Conditional Screen Flow */}
      <AnimatePresence mode="wait">
        {!isConnected ? (
          /* 1. CONNECTION SCREEN */
          <motion.main
            key="connection-screen"
            className="main-content"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <ConnectionScreen
              onConnect={connectDb}
              isConnecting={isConnecting}
              connectionError={connectionError}
            />
          </motion.main>
        ) : (
          /* 2. QUERY SCREEN (Two-column layout with Schema Sidebar) */
          <motion.main
            key="query-workspace"
            className="query-workspace"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {/* Left Sidebar: Schema Tree Viewer */}
            <SchemaViewer
              schema={schema}
              isCollapsed={isSchemaCollapsed}
              onToggleCollapse={() => setIsSchemaCollapsed((prev) => !prev)}
            />

            {/* Right Column: Query & Conversation Flow */}
            <div className="query-main-column">
              {/* Hero banner when in IDLE */}
              {status === STATUS.IDLE && history.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  style={{
                    textAlign: 'center',
                    padding: '8px 10px 4px',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(108, 99, 255, 0.12)',
                      border: '1px solid rgba(108, 99, 255, 0.25)',
                      color: 'var(--primary)',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      marginBottom: '12px',
                    }}
                  >
                    <span>✨ Autonomous Multi-Turn SQL Clarification</span>
                  </div>

                  <h1
                    style={{
                      fontSize: 'clamp(1.6rem, 3.5vw, 2.3rem)',
                      fontWeight: '800',
                      letterSpacing: '-0.03em',
                      lineHeight: '1.2',
                      color: 'var(--text-primary)',
                      marginBottom: '8px',
                    }}
                  >
                    Talk to your Database in Plain English
                  </h1>

                  <p
                    style={{
                      fontSize: 'clamp(0.9rem, 1.8vw, 1rem)',
                      color: 'var(--text-secondary)',
                      maxWidth: '560px',
                      margin: '0 auto',
                      lineHeight: '1.5',
                    }}
                  >
                    Detect ambiguities automatically, answer guided clarification questions,
                    and execute verified SQL on your data with confidence.
                  </p>
                </motion.div>
              )}

              {/* Top Control Bar when session is active */}
              {showReset && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 2px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary)',
                        boxShadow: '0 0 8px var(--primary)',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '0.86rem',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Conversation History
                    </span>
                  </div>

                  {/* Start Over / Reset Button */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={reset}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                    >
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                    <span>Start Over</span>
                  </motion.button>
                </motion.div>
              )}

              {/* Conversation Thread Bubbles */}
              <ConversationThread
                history={history}
                clarifications={clarifications}
                status={status}
              />

              {/* Dynamic State Machine Display */}
              <AnimatePresence mode="wait">
                {/* Loading States (ANALYZING or GENERATING) */}
                {(status === STATUS.ANALYZING || status === STATUS.GENERATING) && (
                  <LoadingState key="loading" status={status} />
                )}

                {/* Clarification Card (CLARIFYING) */}
                {status === STATUS.CLARIFYING && (
                  <ClarificationCard
                    key={`clarify-${turn}`}
                    question={currentQuestion}
                    reason={reason}
                    turn={turn}
                    confidence={confidence}
                    onSubmitAnswer={submitClarification}
                  />
                )}

                {/* Results Panel (RESULTS) with Execution Time & Pagination */}
                {status === STATUS.RESULTS && sqlResult && (
                  <ResultsPanel
                    key="results"
                    sqlResult={sqlResult}
                    onChangePage={changePage}
                    isPaginating={isPaginating}
                  />
                )}

                {/* Error State (ERROR) */}
                {status === STATUS.ERROR && (
                  <ErrorState key="error" error={error} onReset={reset} />
                )}
              </AnimatePresence>

              {/* Query Input Area */}
              <QueryInput
                key={status === STATUS.IDLE ? 'idle' : `active-${originalQuery}`}
                status={status}
                originalQuery={originalQuery}
                onSubmit={submitQuery}
              />
            </div>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}
