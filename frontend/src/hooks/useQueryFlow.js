import { useState, useCallback, useRef } from 'react';
import {
  connectDatabase,
  disconnectDatabase,
  analyzeQuery,
  generateSQL,
} from '../api/client.js';

export function extractDbType(connectionString) {
  if (!connectionString) return 'SQLite';
  const lower = connectionString.trim().toLowerCase();
  if (lower.startsWith('sqlite')) return 'SQLite';
  if (lower.startsWith('postgresql') || lower.startsWith('postgres')) return 'PostgreSQL';
  if (lower.startsWith('mysql')) return 'MySQL';
  return 'SQL Database';
}

export function extractDbName(connectionString) {
  if (!connectionString) return 'database';
  const cleaned = connectionString.trim().split('?')[0];
  const lastSlashIndex = cleaned.lastIndexOf('/');
  const rawTarget = lastSlashIndex !== -1 ? cleaned.slice(lastSlashIndex + 1) : cleaned;

  if (connectionString.trim().toLowerCase().startsWith('sqlite')) {
    if (rawTarget.toLowerCase().endsWith('.db')) {
      return rawTarget.slice(0, -3) || 'database';
    }
    return rawTarget || 'database';
  }
  return rawTarget || 'database';
}

export function formatExecutionTime(ms) {
  if (ms == null) return null;
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

export function useQueryFlow() {
  const [state, setState] = useState({
    status: 'idle', // 'idle' | 'connecting' | 'analyzing' | 'clarifying' | 'generating' | 'results' | 'error'
    sessionId: null,
    dbType: null,
    dbName: null,
    schema: null,
    originalQuery: '',
    clarifications: [],
    currentQuestion: null,
    confidence: null,
    turn: 0,
    sqlResult: null,
    executionTime: null,
    error: null,
    page: 1,
    limit: 20,
    history: [], // [{ id, type: 'user' | 'system' | 'answer', text, confidence, turn }]
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const connectDb = useCallback(async (connectionString) => {
    const dbType = extractDbType(connectionString);
    const dbName = extractDbName(connectionString);

    setState((prev) => ({
      ...prev,
      status: 'connecting',
      error: null,
      dbType,
      dbName,
    }));

    try {
      const data = await connectDatabase(connectionString);
      if (!data || !data.success) {
        throw new Error(data?.message || 'Failed to connect to database with provided connection string.');
      }

      setState((prev) => ({
        ...prev,
        status: 'idle',
        sessionId: data.session_id,
        schema: data.schema || '',
        dbType,
        dbName,
        originalQuery: '',
        clarifications: [],
        currentQuestion: null,
        confidence: null,
        turn: 0,
        sqlResult: null,
        executionTime: null,
        error: null,
        page: 1,
        history: [],
      }));
      return true;
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: err.message || 'Database connection error.',
      }));
      return false;
    }
  }, []);

  const disconnectDb = useCallback(async () => {
    const currentSession = stateRef.current.sessionId;
    if (currentSession) {
      try {
        await disconnectDatabase(currentSession);
      } catch (e) {
        console.warn('Disconnect warning:', e);
      }
    }

    setState({
      status: 'idle',
      sessionId: null,
      dbType: null,
      dbName: null,
      schema: null,
      originalQuery: '',
      clarifications: [],
      currentQuestion: null,
      confidence: null,
      turn: 0,
      sqlResult: null,
      executionTime: null,
      error: null,
      page: 1,
      limit: 20,
      history: [],
    });
  }, []);
  const submitQuery = useCallback(async (query) => {
    const trimmed = (query || '').trim();
    if (!trimmed) return;

    const currentSession = stateRef.current.sessionId;
    if (!currentSession) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: 'No active database session. Please connect first.',
      }));
      return;
    }

    const queryEntry = {
      id: `q-${Date.now()}`,
      type: 'user',
      text: trimmed,
    };

    setState((prev) => ({
      ...prev,
      status: 'analyzing',
      originalQuery: trimmed,
      clarifications: [],
      currentQuestion: null,
      confidence: null,
      turn: 0,
      sqlResult: null,
      executionTime: null,
      error: null,
      page: 1,
      history: [queryEntry],
    }));

    try {
      const analyzeResult = await analyzeQuery(trimmed, [], currentSession);
      const isAmbiguous = Boolean(analyzeResult?.is_ambiguous);

      if (isAmbiguous && analyzeResult?.clarification_question) {
        const questionText = analyzeResult.clarification_question;
        const confidenceScore = typeof analyzeResult.confidence === 'number' ? analyzeResult.confidence : 0.6;

        setState((prev) => ({
          ...prev,
          status: 'clarifying',
          currentQuestion: questionText,
          confidence: confidenceScore,
          turn: 0,
          history: [
            ...prev.history,
            {
              id: `c-0-${Date.now()}`,
              type: 'system',
              text: questionText,
              confidence: confidenceScore,
              turn: 0,
            },
          ],
        }));
      } else {
        // Direct generation
        setState((prev) => ({ ...prev, status: 'generating' }));
        const t0 = Date.now();
        const genResult = await generateSQL(trimmed, [], currentSession, stateRef.current.limit, 0);
        const t1 = Date.now();
        const durationMs = t1 - t0;

        setState((prev) => ({
          ...prev,
          status: 'results',
          sqlResult: genResult,
          executionTime: formatExecutionTime(durationMs),
          page: 1,
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: err.message || 'Error occurred while processing query.',
      }));
    }
  }, []);

  const submitClarification = useCallback(async (answer) => {
    const trimmed = (answer || '').trim();
    if (!trimmed) return;

    const {
      originalQuery,
      clarifications,
      turn,
      sessionId,
      limit,
    } = stateRef.current;

    const nextClarifications = [...clarifications, trimmed];
    const nextTurn = turn + 1;

    const answerEntry = {
      id: `a-${nextTurn}-${Date.now()}`,
      type: 'answer',
      text: trimmed,
      turn: nextTurn,
    };

    setState((prev) => ({
      ...prev,
      clarifications: nextClarifications,
      turn: nextTurn,
      history: [...prev.history, answerEntry],
    }));

    // If turn >= 3, force generate SQL directly without more questions
    if (nextTurn >= 3) {
      setState((prev) => ({ ...prev, status: 'generating' }));
      try {
        const t0 = Date.now();
        const genResult = await generateSQL(originalQuery, nextClarifications, sessionId, limit, 0);
        const t1 = Date.now();
        const durationMs = t1 - t0;

        setState((prev) => ({
          ...prev,
          status: 'results',
          sqlResult: genResult,
          executionTime: formatExecutionTime(durationMs),
          page: 1,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: err.message || 'Error generating SQL from clarifications.',
        }));
      }
      return;
    }

    // Otherwise, re-call /analyze to check if query is still ambiguous
    setState((prev) => ({ ...prev, status: 'analyzing' }));

    try {
      const analyzeResult = await analyzeQuery(originalQuery, nextClarifications, sessionId);
      const isAmbiguous = Boolean(analyzeResult?.is_ambiguous);

      if (isAmbiguous && analyzeResult?.clarification_question) {
        const questionText = analyzeResult.clarification_question;
        const confidenceScore = typeof analyzeResult.confidence === 'number' ? analyzeResult.confidence : 0.65;

        setState((prev) => ({
          ...prev,
          status: 'clarifying',
          currentQuestion: questionText,
          confidence: confidenceScore,
          history: [
            ...prev.history,
            {
              id: `c-${nextTurn}-${Date.now()}`,
              type: 'system',
              text: questionText,
              confidence: confidenceScore,
              turn: nextTurn,
            },
          ],
        }));
      } else {
        // Query clarified! Now generate SQL
        setState((prev) => ({ ...prev, status: 'generating' }));
        const t0 = Date.now();
        const genResult = await generateSQL(originalQuery, nextClarifications, sessionId, limit, 0);
        const t1 = Date.now();
        const durationMs = t1 - t0;

        setState((prev) => ({
          ...prev,
          status: 'results',
          sqlResult: genResult,
          executionTime: formatExecutionTime(durationMs),
          page: 1,
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: err.message || 'Error analyzing clarification.',
      }));
    }
  }, []);

  const goToPage = useCallback(async (pageNumber) => {
    const { originalQuery, clarifications, sessionId, limit } = stateRef.current;
    if (!sessionId || !originalQuery) return;

    const offset = Math.max(0, (pageNumber - 1) * limit);

    try {
      const t0 = Date.now();
      const genResult = await generateSQL(originalQuery, clarifications, sessionId, limit, offset);
      const t1 = Date.now();
      const durationMs = t1 - t0;

      setState((prev) => ({
        ...prev,
        status: 'results',
        sqlResult: genResult,
        executionTime: formatExecutionTime(durationMs),
        page: pageNumber,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err.message || 'Failed to navigate to requested page.',
      }));
    }
  }, []);

  const changeLimit = useCallback(async (newLimit) => {
    const num = Number(newLimit) || 20;
    const { originalQuery, clarifications, sessionId } = stateRef.current;
    if (!sessionId || !originalQuery) return;

    try {
      const t0 = Date.now();
      const genResult = await generateSQL(originalQuery, clarifications, sessionId, num, 0);
      const t1 = Date.now();
      const durationMs = t1 - t0;

      setState((prev) => ({
        ...prev,
        limit: num,
        page: 1,
        status: 'results',
        sqlResult: genResult,
        executionTime: formatExecutionTime(durationMs),
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err.message || 'Failed to update page size.',
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: 'idle',
      originalQuery: '',
      clarifications: [],
      currentQuestion: null,
      confidence: null,
      turn: 0,
      sqlResult: null,
      executionTime: null,
      error: null,
      page: 1,
      history: [],
    }));
  }, []);

  return {
    ...state,
    isConnected: Boolean(state.sessionId),
    connectDb,
    disconnectDb,
    submitQuery,
    submitClarification,
    goToPage,
    changeLimit,
    reset,
  };
}
