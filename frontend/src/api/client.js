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
    // The server responded with a status outside 2xx
    const detail =
      error.response.data?.detail ||
      error.response.data?.message ||
      JSON.stringify(error.response.data) ||
      error.response.statusText;
    const status = error.response.status;
    const err = new Error(`API Error (${status}) during ${contextDescription}: ${detail}`);
    err.isApiError = true;
    err.status = status;
    throw err;
  } else if (error.request) {
    // Request was initiated but no response was received (e.g. backend down / CORS issue)
    const err = new Error(
      `Network Error: Unable to connect to backend at ${API_BASE_URL}. Ensure the FastAPI server is running (e.g., uvicorn main:app --reload).`
    );
    err.isNetworkError = true;
    throw err;
  } else {
    // Something else went wrong configuring the request
    const err = new Error(`Request setup error: ${error.message}`);
    throw err;
  }
}

/**
 * Analyzes the user's natural language query and any accumulated clarifications for ambiguity.
 * @param {string} query
 * @param {string[]} clarifications
 * @returns {Promise<{ is_ambiguous: boolean, reason?: string, clarification_question?: string, confidence: number }>}
 */
export async function analyzeQuery(query, clarifications = []) {
  try {
    const response = await apiClient.post('/analyze', {
      query,
      clarifications,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'query analysis');
  }
}

/**
 * Generates SQL and executes it against the database.
 * @param {string} query
 * @param {string[]} clarifications
 * @returns {Promise<{ sql: string, results: Array<Record<string, any>>, row_count: number }>}
 */
export async function generateSQL(query, clarifications = []) {
  try {
    const response = await apiClient.post('/generate', {
      query,
      clarifications,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'SQL generation & execution');
  }
}
