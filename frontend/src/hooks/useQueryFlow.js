import { useReducer, useCallback } from 'react';
import {
  analyzeQuery,
  generateSQL,
  connectDatabase,
  disconnectDatabase,
} from '../api/client';

export const STATUS = {
  IDLE: 'IDLE',
  ANALYZING: 'ANALYZING',
  CLARIFYING: 'CLARIFYING',
  GENERATING: 'GENERATING',
  RESULTS: 'RESULTS',
  ERROR: 'ERROR',
};

const initialState = {
  status: STATUS.IDLE,
  originalQuery: '',
  clarifications: [],
  currentQuestion: '',
  turn: 0,
  confidence: 1,
  reason: '',
  sqlResult: null,
  error: null,
  history: [], // Array of { id, type, content, turn, confidence, reason, timestamp }

  // Database session & connection state
  sessionId: null,
  schema: null,
  connectionString: '',
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  isPaginating: false,
};

function queryFlowReducer(state, action) {
  switch (action.type) {
    case 'START_CONNECTING': {
      return {
        ...state,
        isConnecting: true,
        connectionError: null,
      };
    }

    case 'CONNECT_SUCCESS': {
      const { sessionId, schema, connectionString } = action.payload;
      return {
        ...state,
        isConnected: true,
        isConnecting: false,
        sessionId,
        schema,
        connectionString,
        connectionError: null,
        status: STATUS.IDLE,
        originalQuery: '',
        clarifications: [],
        history: [],
        sqlResult: null,
        error: null,
        isPaginating: false,
      };
    }

    case 'CONNECT_FAILURE': {
      return {
        ...state,
        isConnecting: false,
        isConnected: false,
        connectionError: action.payload.error,
      };
    }

    case 'DISCONNECT': {
      return {
        ...initialState,
      };
    }

    case 'START_QUERY_ANALYSIS': {
      const { query } = action.payload;
      return {
        ...state,
        status: STATUS.ANALYZING,
        originalQuery: query,
        turn: 0,
        clarifications: [],
        sqlResult: null,
        error: null,
        history: [
          {
            id: `query-${Date.now()}`,
            type: 'user_query',
            content: query,
            timestamp: Date.now(),
          },
        ],
      };
    }

    case 'AMBIGUITY_DETECTED': {
      const { question, reason, confidence, nextTurn } = action.payload;
      return {
        ...state,
        status: STATUS.CLARIFYING,
        currentQuestion: question,
        reason: reason || '',
        confidence: typeof confidence === 'number' ? confidence : 0.5,
        turn: nextTurn,
        history: [
          ...state.history,
          {
            id: `clarify-${Date.now()}`,
            type: 'system_clarification',
            content: question,
            reason: reason || '',
            confidence: typeof confidence === 'number' ? confidence : 0.5,
            turn: nextTurn,
            timestamp: Date.now(),
          },
        ],
      };
    }

    case 'START_CLARIFICATION_ANALYSIS': {
      const { answer, updatedClarifications } = action.payload;
      return {
        ...state,
        status: STATUS.ANALYZING,
        clarifications: updatedClarifications,
        history: [
          ...state.history,
          {
            id: `answer-${Date.now()}`,
            type: 'user_answer',
            content: answer,
            turn: state.turn,
            timestamp: Date.now(),
          },
        ],
      };
    }

    case 'START_GENERATING': {
      return {
        ...state,
        status: STATUS.GENERATING,
      };
    }

    case 'START_PAGINATING': {
      return {
        ...state,
        isPaginating: true,
      };
    }

    case 'SET_RESULTS': {
      return {
        ...state,
        status: STATUS.RESULTS,
        isPaginating: false,
        sqlResult: action.payload,
        error: null,
      };
    }

    case 'SET_ERROR': {
      return {
        ...state,
        status: STATUS.ERROR,
        isPaginating: false,
        error: action.payload.error,
      };
    }

    case 'RESET': {
      return {
        ...state,
        status: STATUS.IDLE,
        originalQuery: '',
        clarifications: [],
        currentQuestion: '',
        turn: 0,
        confidence: 1,
        reason: '',
        sqlResult: null,
        error: null,
        history: [],
        isPaginating: false,
      };
    }

    default:
      return state;
  }
}

export function useQueryFlow() {
  const [state, dispatch] = useReducer(queryFlowReducer, initialState);

  /**
   * Connect to database using connection string.
   */
  const connectDb = useCallback(async (connectionString) => {
    const trimmed = (connectionString || '').trim();
    if (!trimmed) {
      dispatch({
        type: 'CONNECT_FAILURE',
        payload: { error: 'Please provide a valid database connection string.' },
      });
      return false;
    }

    dispatch({ type: 'START_CONNECTING' });

    try {
      const res = await connectDatabase(trimmed);
      if (res && res.success) {
        dispatch({
          type: 'CONNECT_SUCCESS',
          payload: {
            sessionId: res.session_id,
            schema: res.schema,
            connectionString: trimmed,
          },
        });
        return true;
      } else {
        const errorMsg =
          res?.message || res?.error || 'Failed to connect to database. Check connection string.';
        dispatch({
          type: 'CONNECT_FAILURE',
          payload: { error: errorMsg },
        });
        return false;
      }
    } catch (err) {
      dispatch({
        type: 'CONNECT_FAILURE',
        payload: { error: err.rawDetail || err.message || 'Connection failed.' },
      });
      return false;
    }
  }, []);

  /**
   * Disconnect the current database session.
   */
  const disconnectDb = useCallback(async () => {
    if (state.sessionId) {
      try {
        await disconnectDatabase(state.sessionId);
      } catch (err) {
        console.warn('Disconnect error ignored:', err);
      }
    }
    dispatch({ type: 'DISCONNECT' });
  }, [state.sessionId]);

  /**
   * Submit the natural language query for the active session.
   */
  const submitQuery = useCallback(async (query) => {
    const trimmed = (query || '').trim();
    if (!trimmed) return;

    dispatch({ type: 'START_QUERY_ANALYSIS', payload: { query: trimmed } });

    try {
      const analyzeData = await analyzeQuery(trimmed, [], state.sessionId);

      if (analyzeData?.is_ambiguous) {
        dispatch({
          type: 'AMBIGUITY_DETECTED',
          payload: {
            question: analyzeData.clarification_question || 'Could you provide more details?',
            reason: analyzeData.reason || 'The query requires clarification.',
            confidence: analyzeData.confidence ?? 0.5,
            nextTurn: 1,
          },
        });
      } else {
        // Query is clear -> immediately generate SQL & measure execution time
        dispatch({ type: 'START_GENERATING' });
        const startTime = performance.now();
        const genData = await generateSQL(trimmed, [], state.sessionId, 20, 0);
        const endTime = performance.now();
        const executionTimeMs = Math.round(endTime - startTime);

        dispatch({
          type: 'SET_RESULTS',
          payload: {
            sql: genData.sql,
            results: genData.results || [],
            row_count: genData.row_count ?? (genData.results ? genData.results.length : 0),
            total_count: genData.total_count ?? (genData.results ? genData.results.length : 0),
            current_page: genData.current_page ?? 1,
            total_pages: genData.total_pages ?? 1,
            limit: genData.limit ?? 20,
            offset: genData.offset ?? 0,
            executionTimeMs,
          },
        });
      }
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: { error: err.rawDetail || err.message || 'Failed to process query' },
      });
    }
  }, [state.sessionId]);

  /**
   * Submit an answer to a clarification question.
   */
  const submitClarification = useCallback(async (answer) => {
    const trimmedAnswer = (answer || '').trim();
    if (!trimmedAnswer) return;

    const currentTurn = state.turn;
    const updatedClarifications = [...state.clarifications, trimmedAnswer];

    dispatch({
      type: 'START_CLARIFICATION_ANALYSIS',
      payload: {
        answer: trimmedAnswer,
        updatedClarifications,
      },
    });

    try {
      // If turn was already 3, force generate regardless
      if (currentTurn >= 3) {
        dispatch({ type: 'START_GENERATING' });
        const startTime = performance.now();
        const genData = await generateSQL(
          state.originalQuery,
          updatedClarifications,
          state.sessionId,
          20,
          0
        );
        const endTime = performance.now();
        const executionTimeMs = Math.round(endTime - startTime);

        dispatch({
          type: 'SET_RESULTS',
          payload: {
            sql: genData.sql,
            results: genData.results || [],
            row_count: genData.row_count ?? (genData.results ? genData.results.length : 0),
            total_count: genData.total_count ?? (genData.results ? genData.results.length : 0),
            current_page: genData.current_page ?? 1,
            total_pages: genData.total_pages ?? 1,
            limit: genData.limit ?? 20,
            offset: genData.offset ?? 0,
            executionTimeMs,
          },
        });
        return;
      }

      // Re-analyze with updated clarifications
      const analyzeData = await analyzeQuery(
        state.originalQuery,
        updatedClarifications,
        state.sessionId
      );

      if (analyzeData?.is_ambiguous && currentTurn < 3) {
        dispatch({
          type: 'AMBIGUITY_DETECTED',
          payload: {
            question: analyzeData.clarification_question || 'Could you clarify further?',
            reason: analyzeData.reason || 'Additional detail is required.',
            confidence: analyzeData.confidence ?? 0.6,
            nextTurn: currentTurn + 1,
          },
        });
      } else {
        dispatch({ type: 'START_GENERATING' });
        const startTime = performance.now();
        const genData = await generateSQL(
          state.originalQuery,
          updatedClarifications,
          state.sessionId,
          20,
          0
        );
        const endTime = performance.now();
        const executionTimeMs = Math.round(endTime - startTime);

        dispatch({
          type: 'SET_RESULTS',
          payload: {
            sql: genData.sql,
            results: genData.results || [],
            row_count: genData.row_count ?? (genData.results ? genData.results.length : 0),
            total_count: genData.total_count ?? (genData.results ? genData.results.length : 0),
            current_page: genData.current_page ?? 1,
            total_pages: genData.total_pages ?? 1,
            limit: genData.limit ?? 20,
            offset: genData.offset ?? 0,
            executionTimeMs,
          },
        });
      }
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: { error: err.rawDetail || err.message || 'Failed to process clarification' },
      });
    }
  }, [state.turn, state.clarifications, state.originalQuery, state.sessionId]);

  /**
   * Request a different page of results for the existing query without resetting session.
   */
  const changePage = useCallback(async (newPage, newLimit) => {
    if (!state.originalQuery || !state.sessionId) return;
    const limit = newLimit || state.sqlResult?.limit || 20;
    const offset = Math.max(0, (newPage - 1) * limit);

    dispatch({ type: 'START_PAGINATING' });

    const startTime = performance.now();
    try {
      const genData = await generateSQL(
        state.originalQuery,
        state.clarifications,
        state.sessionId,
        limit,
        offset
      );
      const endTime = performance.now();
      const executionTimeMs = Math.round(endTime - startTime);

      dispatch({
        type: 'SET_RESULTS',
        payload: {
          sql: genData.sql || state.sqlResult?.sql,
          results: genData.results || [],
          row_count: genData.row_count ?? (genData.results ? genData.results.length : 0),
          total_count: genData.total_count ?? state.sqlResult?.total_count ?? (genData.results ? genData.results.length : 0),
          current_page: genData.current_page ?? newPage,
          total_pages: genData.total_pages ?? Math.max(1, Math.ceil((genData.total_count || 1) / limit)),
          limit: genData.limit ?? limit,
          offset: genData.offset ?? offset,
          executionTimeMs,
        },
      });
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: { error: err.rawDetail || err.message || 'Failed to load page' },
      });
    }
  }, [state.originalQuery, state.clarifications, state.sessionId, state.sqlResult]);

  /**
   * Reset conversation state back to IDLE (keeps DB connected).
   */
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    status: state.status,
    originalQuery: state.originalQuery,
    clarifications: state.clarifications,
    currentQuestion: state.currentQuestion,
    turn: state.turn,
    confidence: state.confidence,
    reason: state.reason,
    sqlResult: state.sqlResult,
    error: state.error,
    history: state.history,

    // Database connection & session info
    sessionId: state.sessionId,
    schema: state.schema,
    connectionString: state.connectionString,
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    connectionError: state.connectionError,
    isPaginating: state.isPaginating,

    // Methods
    connectDb,
    disconnectDb,
    submitQuery,
    submitClarification,
    changePage,
    reset,
  };
}
