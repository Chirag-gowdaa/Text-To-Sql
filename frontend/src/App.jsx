import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, RotateCcw } from 'lucide-react';
import { useQueryFlow } from './hooks/useQueryFlow';
import Sidebar from './components/Sidebar';
import ConnectionScreen from './components/ConnectionScreen';
import QueryInput from './components/QueryInput';
import ConversationThread from './components/ConversationThread';
import ResultsPanel from './components/ResultsPanel';
import LoadingText from './components/LoadingText';
import ErrorCard from './components/ErrorCard';

export default function App() {
  const {
    status,
    sessionId,
    dbType,
    dbName,
    schema,
    originalQuery,
    clarifications,
    currentQuestion,
    confidence,
    turn,
    sqlResult,
    executionTime,
    error,
    page,
    limit,
    history,
    isConnected,
    connectDb,
    disconnectDb,
    submitQuery,
    submitClarification,
    goToPage,
    changeLimit,
    reset,
  } = useQueryFlow();

  // Dark / Light Theme management
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('queryMindTheme') || 'dark';
  });

  // Mobile drawer state for sidebar (< 768px)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('queryMindTheme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Determine current breadcrumb state
  const isQueryStepActive =
    isConnected &&
    (status === 'idle' || status === 'analyzing' || status === 'clarifying' || status === 'generating');
  const isResultsStepActive = isConnected && status === 'results';

  // SCREEN 1: Connection screen before connecting
  if (!isConnected) {
    return (
      <div className="app-shell">
        <ConnectionScreen
          onConnect={connectDb}
          isConnecting={status === 'connecting'}
          error={status === 'error' ? error : null}
        />
      </div>
    );
  }

  // SCREEN 2: Two-panel workspace after connecting
  return (
    <div className="app-shell">
      <div className="two-panel-shell">
        {/* Desktop Sidebar (280px fixed) */}
        <div className="desktop-sidebar-wrapper" style={{ display: 'contents' }}>
          <Sidebar
            dbName={dbName || 'database'}
            dbType={dbType}
            schema={schema || ''}
            onDisconnect={disconnectDb}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        </div>

        {/* Mobile Bottom Sheet Drawer (< 768px) */}
        <AnimatePresence>
          {mobileDrawerOpen && (
            <>
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setMobileDrawerOpen(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.65)',
                  zIndex: 90,
                  backdropFilter: 'blur(2px)',
                }}
              />
              {/* Drawer Sheet */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  maxHeight: '80vh',
                  backgroundColor: 'var(--surface)',
                  borderTop: '1px solid var(--border)',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <span className="logo-text" style={{ fontSize: '16px' }}>
                    Database Schema
                  </span>
                  <button
                    type="button"
                    className="ghost-action-btn"
                    onClick={() => setMobileDrawerOpen(false)}
                    style={{ padding: '4px' }}
                  >
                    <X size={18} />
                  </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <Sidebar
                    dbName={dbName || 'database'}
                    dbType={dbType}
                    schema={schema || ''}
                    onDisconnect={() => {
                      setMobileDrawerOpen(false);
                      disconnectDb();
                    }}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Right Panel (Remaining Width) */}
        <main className="main-panel">
          {/* Top bar: Breadcrumb showing Connect → Query → Results */}
          <header className="breadcrumb-bar">
            <div className="breadcrumb-list">
              {/* Mobile menu trigger */}
              <button
                type="button"
                className="ghost-action-btn mobile-menu-btn"
                onClick={() => setMobileDrawerOpen(true)}
                style={{ padding: '4px', marginRight: '4px' }}
                title="View Database Schema"
              >
                <Menu size={16} />
              </button>

              <span
                style={{
                  color: isConnected ? 'var(--accent)' : 'var(--text-3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Connect
              </span>
              <span className="breadcrumb-separator">→</span>
              <span className={`breadcrumb-item ${isQueryStepActive ? 'active' : ''}`}>
                Query
              </span>
              <span className="breadcrumb-separator">→</span>
              <span className={`breadcrumb-item ${isResultsStepActive ? 'active' : ''}`}>
                Results
              </span>
            </div>

            {/* Top Right: Reset/New Query if results or clarification present */}
            {(status === 'results' || status === 'clarifying' || history.length > 0) && (
              <button
                type="button"
                className="ghost-action-btn"
                onClick={reset}
                title="Start a new query"
              >
                <RotateCcw size={13} />
                <span>New query</span>
              </button>
            )}
          </header>

          {/* Main workspace area */}
          <div className="workspace-scrollable">
            <div className="workspace-content-container">
              {/* Section A: Query Input (Always accessible at top of workspace) */}
              <QueryInput
                onSubmit={submitQuery}
                disabled={status === 'analyzing' || status === 'generating'}
                initialValue={status === 'idle' ? originalQuery : ''}
              />

              {/* Section B: Conversation Thread */}
              <ConversationThread
                history={history}
                status={status}
                currentQuestion={currentQuestion}
                confidence={confidence}
                onSubmitClarification={submitClarification}
              />

              {/* SCREEN 3: Loading States (Analyzing / Generating with Schema preview) */}
              {(status === 'analyzing' || status === 'generating') && (
                <LoadingText status={status} schema={schema} />
              )}

              {/* SCREEN 4: Error State */}
              {status === 'error' && error && (
                <ErrorCard
                  error={error}
                  onTryAgain={() => {
                    if (originalQuery) {
                      submitQuery(originalQuery);
                    } else {
                      reset();
                    }
                  }}
                />
              )}

              {/* Section C: Results Section (SQL block, Results table, Pagination) */}
              {status === 'results' && sqlResult && (
                <ResultsPanel
                  sqlResult={sqlResult}
                  executionTime={executionTime}
                  dbType={dbType}
                  limit={limit}
                  onPageChange={goToPage}
                  onLimitChange={changeLimit}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
