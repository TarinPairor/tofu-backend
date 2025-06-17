require('dotenv').config();
const openai = require('openai');


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

    client = new openai.OpenAI({
        apiKey: apiKey,
        base_url: base_url,
        timeout: 10000, // 10 seconds client will wait for a response
    });
    
    const prompt = [
        {
            "role": "system",
            "content": system_prompt
        },
        {   
            "role": "user",
            "content": input
        }
    ];

    response = client.chat.completions.create(
        model=model_name,
        messages=prompt,
    )

    return await response.then(res => {
        if (res.choices && res.choices.length > 0) {
            return res.choices[0].message.content;
        } else {
            throw new Error('No response from the model');
        }
    }).catch(err => {
        console.error('Error during API request:', err);
        throw err;
    });

};

module.exports = request_model;