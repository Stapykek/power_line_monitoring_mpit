require('dotenv').config()
/**
 * AI Service Client
 * Provides a clean interface to communicate with the AI inference service
 */

const fetch = require('node-fetch');

class AIServiceClient {
  constructor(aiServiceUrl) {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5001';
  }

 /**
   * Trigger image analysis for a session
   * @param {string} sessionId - The session ID to analyze
   * @returns {Promise<Object>} Analysis response
   */
  async analyzeSession(sessionId) {
    try {
      const response = await fetch(`${this.aiServiceUrl}/analyze/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`AI service returned status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error triggering AI analysis for session ${sessionId}:`, error);
      throw error;
    }
 }

  /**
   * Get analysis results for a session
   * @param {string} sessionId - The session ID to get results for
   * @returns {Promise<Object>} Results data
   */
  async getResults(sessionId) {
    try {
      const response = await fetch(`${this.aiServiceUrl}/results/${sessionId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Results not found');
        }
        throw new Error(`AI service returned status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error getting AI results for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get analysis status for a session
   * @param {string} sessionId - The session ID to get status for
   * @returns {Promise<Object>} Status data
   */
  async getStatus(sessionId) {
    try {
      const response = await fetch(`${this.aiServiceUrl}/status/${sessionId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Session not found');
        }
        throw new Error(`AI service returned status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error getting AI status for session ${sessionId}:`, error);
      throw error;
    }
 }

  /**
   * Health check for the AI service
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.aiServiceUrl}/health`);

      if (!response.ok) {
        throw new Error(`AI service returned status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking AI service health:', error);
      throw error;
    }
  }

  /**
   * Get segmentation status for a session
   * @param {string} sessionId - The session ID to get segmentation status for
   * @returns {Promise<Object>} Segmentation status data
   */
  async getSegmentationStatus(sessionId) {
    try {
      const response = await fetch(`${this.aiServiceUrl}/segmentation-status/${sessionId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Segmentation status not found');
        }
        throw new Error(`AI service returned status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error getting segmentation status for session ${sessionId}:`, error);
      throw error;
    }
  }
}

module.exports = AIServiceClient;