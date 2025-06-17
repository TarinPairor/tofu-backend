require('dotenv').config();
const fetch = require('node-fetch');
const { options } = require('../routes');


/**
 * Sends a request to the OpenAI API with the provided input and system prompt.
 * Uses environment variables for API configuration and defaults to 'sonar-pro' model.
 * 
 * @param {string} input - The user input/query to send to the model
 * @param {string} system_prompt - The system prompt that provides context/instructions to the model
 * @returns {Promise<string>} A promise that resolves with the model's response text
 * @throws {Error} If API_KEY is not defined in environment variables
 * @throws {Error} If no response is received from the model
 * @throws {Error} If there's an error during the API request
 * 
 * @requires dotenv
 * @requires openai
 * 
 * @example
 * const response = await request_model(
 *   "What is the capital of France?",
 *   "You are a helpful assistant."
 * );
 */
async function request_model (input, system_prompt) {
    // Define api_key, base_url and model_name from environment variables
    const apiKey = process.env.API_KEY;
    const base_url = process.env.BASE_URL || "https://api.perplexity.ai";
    const model_name = process.env.MODEL_NAME || "sonar-pro";

    if (!apiKey) {
        throw new Error('API_KEY is not defined in the environment variables');
    }

    const prompt = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: system_prompt
          },
          {
            role: "user",
            content: input
          }
        ]
      })
    };

    const response = await fetch(`${base_url}/v1/chat/completions`, prompt);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
    }


    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
    } else {
        throw new Error('No response from the model');
    }

};

module.exports = request_model;