import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

/**
 * Formats an Axios error into a human-readable message,
 * distinguishing network unreachable vs backend API errors.
 */
function handleApiError(error, contextDescription) {
  if (error.response) {
    const detail =
      error.response.data?.message ||
      error.response.data?.detail ||
      error.response.data?.error ||
      JSON.stringify(error.response.data) ||
      error.response.statusText;
    const status = error.response.status;
    const err = new Error(`API Error (${status}) during ${contextDescription}: ${detail}`);
    err.isApiError = true;
    err.status = status;
    err.rawDetail = detail;
    throw err;
  } else if (error.request) {
    const err = new Error(
      `Network Error: Unable to connect to backend at ${API_BASE_URL}. Ensure the FastAPI server is running (e.g., uvicorn main:app --reload).`
    );
    err.isNetworkError = true;
    throw err;
  } else {
    const err = new Error(`Request setup error: ${error.message}`);
    throw err;
  }
}

/**
 * Connects to a database using a connection string.
 * @param {string} connectionString
 * @returns {Promise<{ success: boolean, session_id?: string, schema?: string, message?: string }>}
 */
export async function connectDatabase(connectionString) {
  try {
    const response = await apiClient.post('/connect', {
      connection_string: connectionString,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'database connection');
  }
}

/**
 * Disconnects from an active database session.
 * @param {string} sessionId
 * @returns {Promise<{ message: string }>}
 */
export async function disconnectDatabase(sessionId) {
  try {
    const response = await apiClient.post(
      '/disconnect',
      { session_id: sessionId },
      { params: { session_id: sessionId } }
    );
    return response.data;
  } catch (error) {
    return handleApiError(error, 'database disconnection');
  }
}

/**
 * Analyzes the user's natural language query and any accumulated clarifications for ambiguity.
 * @param {string} query
 * @param {string[]} clarifications
 * @param {string} sessionId
 * @returns {Promise<{ is_ambiguous: boolean, reason?: string, clarification_question?: string, confidence: number }>}
 */
export async function analyzeQuery(query, clarifications = [], sessionId = '') {
  try {
    const response = await apiClient.post('/analyze', {
      query,
      clarifications,
      session_id: sessionId,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'query analysis');
  }
}

/**
 * Generates SQL and executes it against the database with pagination support.
 * @param {string} query
 * @param {string[]} clarifications
 * @param {string} sessionId
 * @param {number} limit
 * @param {number} offset
 * @returns {Promise<{ sql: string, results: Array<Record<string, any>>, row_count: number, total_count: number, current_page: number, total_pages: number, limit: number, offset: number }>}
 */
export async function generateSQL(query, clarifications = [], sessionId = '', limit = 20, offset = 0) {
  try {
    const response = await apiClient.post(
      '/generate',
      {
        query,
        clarifications,
        session_id: sessionId,
        limit,
        offset,
      },
      {
        params: { limit, offset },
      }
    );
    return response.data;
  } catch (error) {
    return handleApiError(error, 'SQL generation & execution');
  }
}
