import { useReducer, useCallback } from 'react';
import { analyzeQuery, generateSQL } from '../api/client';

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
};

function queryFlowReducer(state, action) {
  switch (action.type) {
    case 'START_QUERY_ANALYSIS': {
      const { query } = action.payload;
      return {
        ...initialState,
        status: STATUS.ANALYZING,
        originalQuery: query,
        turn: 0,
        clarifications: [],
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

    case 'SET_RESULTS': {
      const { sql, results, row_count } = action.payload;
      return {
        ...state,
        status: STATUS.RESULTS,
        sqlResult: { sql, results, row_count },
        error: null,
      };
    }

    case 'SET_ERROR': {
      return {
        ...state,
        status: STATUS.ERROR,
        error: action.payload.error,
      };
    }

    case 'RESET': {
      return {
        ...initialState,
      };
    }

    default:
      return state;
  }
}

export function useQueryFlow() {
  const [state, dispatch] = useReducer(queryFlowReducer, initialState);

  /**
   * Submit the initial natural language query.
   */
  const submitQuery = useCallback(async (query) => {
    const trimmed = (query || '').trim();
    if (!trimmed) return;

    dispatch({ type: 'START_QUERY_ANALYSIS', payload: { query: trimmed } });

    try {
      const analyzeData = await analyzeQuery(trimmed, []);

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
        // Query is clear -> immediately generate SQL
        dispatch({ type: 'START_GENERATING' });
        const genData = await generateSQL(trimmed, []);
        dispatch({
          type: 'SET_RESULTS',
          payload: {
            sql: genData.sql,
            results: genData.results || [],
            row_count: genData.row_count ?? (genData.results ? genData.results.length : 0),
          },
        });
      }
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: { error: err.message || 'Failed to process query' },
      });
    }
  }, []);

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
      // If turn was already 3 (or about to exceed max turns), force generate regardless
      if (currentTurn >= 3) {
        dispatch({ type: 'START_GENERATING' });
        const genData = await generateSQL(state.originalQuery, updatedClarifications);
        dispatch({
          type: 'SET_RESULTS',
          payload: {
            sql: genData.sql,
            results: genData.results || [],
            row_count: genData.row_count ?? (genData.results ? genData.results.length : 0),
          },
        });
        return;
      }

      // Re-analyze with updated clarifications
      const analyzeData = await analyzeQuery(state.originalQuery, updatedClarifications);

      if (analyzeData?.is_ambiguous && currentTurn < 3) {
        // Still ambiguous and turns remaining
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
        // Either unambiguous now OR reached max turn limit -> generate SQL
        dispatch({ type: 'START_GENERATING' });
        const genData = await generateSQL(state.originalQuery, updatedClarifications);
        dispatch({
          type: 'SET_RESULTS',
          payload: {
            sql: genData.sql,
            results: genData.results || [],
            row_count: genData.row_count ?? (genData.results ? genData.results.length : 0),
          },
        });
      }
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: { error: err.message || 'Failed to process clarification' },
      });
    }
  }, [state.turn, state.clarifications, state.originalQuery]);

  /**
   * Reset conversation state back to IDLE.
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
    submitQuery,
    submitClarification,
    reset,
  };
}
