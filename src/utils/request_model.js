const axios = require('axios');
require('dotenv').config();


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
 */
async function request_model (input, system_prompt) {
    const apiKey = process.env.API_KEY;
    const baseUrl = process.env.BASE_URL || "https://api.perplexity.ai";
    const modelName = process.env.MODEL_NAME || "sonar-pro";

    if (!apiKey) {
        throw new Error('API_KEY is not defined in the environment variables');
    }

    try {
        const response = await axios.post(`${baseUrl}/chat/completions`, {
            model: modelName,
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
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.choices && response.data.choices.length > 0) {
            return response.data.choices[0].message.content;
        } else {
            throw new Error('No response from the model');
        }
    } catch (error) {
        if (error.response) {
            throw new Error(`API error: ${error.response.status} - ${error.response.data}`);
        }
        throw error;
    }
}

module.exports = request_model;