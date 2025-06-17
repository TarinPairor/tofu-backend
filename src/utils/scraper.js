const fetch = require('node-fetch');

/**
 * Gets Perplexity's interpretation of the content
 * @param {string} url - URL to analyze
 * @returns {Promise<string>} Perplexity's response
 */
async function analyzeContent(url) {
  const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
  if (!perplexityApiKey) {
    throw new Error('PERPLEXITY_API_KEY is required');
}

  try {
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "sonar",
    messages: [
      {
        role: "system",
            content: "Extract product information from the URL. Return ONLY a JSON object in this exact format without any additional text or formatting: {\"productName\": \"name\", \"description\": \"desc\", \"features\": [\"feature1\"]}"
      },
      {
        role: "user",
            content: url
      }
        ]
      })
    };

    const response = await fetch('https://api.perplexity.ai/chat/completions', options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    // Log the full response for debugging
    console.log('Raw API Response:', data);

    // Extract the content from the response
    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid API response structure:', data);
      throw new Error('Invalid API response structure');
    }

    let content = data.choices[0].message.content;
    console.log('Raw content:', content);

    // Clean up the content
    content = content
      .replace(/```json\s*|\s*```/g, '') // Remove code blocks
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
      .replace(/\n/g, '') // Remove newlines
      .replace(/,\s*}/g, '}') // Remove trailing commas
      .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
      .trim();

    console.log('Cleaned content:', content);

    // Try to parse the response content as JSON
    try {
      // First try direct parse
      let parsedContent;
      try {
        parsedContent = JSON.parse(content);
      } catch (initialParseError) {
        // If direct parse fails, try to extract JSON object
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No valid JSON object found in response');
        }
        parsedContent = JSON.parse(jsonMatch[0]);
      }

      // Validate the structure
      if (!parsedContent.productName || !parsedContent.description || !Array.isArray(parsedContent.features)) {
        console.error('Invalid response structure:', parsedContent);
        throw new Error('Response missing required fields');
      }

      // Format the response
      const formattedResponse = {
        productName: parsedContent.productName,
        description: parsedContent.description,
        features: parsedContent.features
      };

      return JSON.stringify(formattedResponse);
    } catch (parseError) {
      console.error('Parse error details:', parseError);
      console.error('Failed content:', content);
      throw new Error(`Failed to parse JSON: ${parseError.message}`);
    }
  } catch (error) {
    console.error('API error details:', error);
    throw error;
  }
}

/**
 * Main function to analyze content from a URL
 * @param {string} url - URL to analyze
 * @returns {Promise<string>} Analysis of the content
 */
async function scrapeContent(url) {
  // Validate URL
  try {
    new URL(url);
  } catch (e) {
    throw new Error('Invalid URL format');
  }

  try {
    return await analyzeContent(url);
  } catch (error) {
    console.error('Scraping error:', error);
    throw new Error(`Failed to analyze content: ${error.message}`);
  }
}

module.exports = {
  scrapeContent
}; 