const express = require('express');
const router = express.Router();
const { scrapeContent } = require('../utils/scraper');
const fetch = require('node-fetch');

/**
 * Analyzes product sustainability and provides recommendations
 * @param {Object} productInfo - Product information from scraper
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeProduct(productInfo) {
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
            content: "You are a sustainable fashion expert. Analyze the product and return ONLY a JSON object with the following structure: {\"sustainabilityCriticism\": [\"criticism1\", \"criticism2\", ...], \"alternativeProducts\": [{\"name\": \"product name\", \"reason\": \"why it's more sustainable\"}], \"sustainabilityScore\": number from 1-10, \"recommendations\": [\"recommendation1\", \"recommendation2\", ...]}"
          },
          {
            role: "user",
            content: `Analyze this product for sustainability: ${JSON.stringify(productInfo)}`
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
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid API response structure');
    }

    let content = data.choices[0].message.content;
    content = content
      .replace(/```json\s*|\s*```/g, '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\n/g, '')
      .trim();

    const analysis = JSON.parse(content);

    // Validate the analysis structure
    if (!analysis.sustainabilityCriticism || !analysis.alternativeProducts || 
        !analysis.sustainabilityScore || !analysis.recommendations) {
      throw new Error('Invalid analysis format');
    }

    return analysis;
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}

router.post('/', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // First get product information
    const productInfo = await scrapeContent(url);
    const parsedProductInfo = JSON.parse(productInfo);

    // Then analyze the product
    const analysis = await analyzeProduct(parsedProductInfo);

    // Combine product info with analysis
    const response = {
      success: true,
      data: {
        product: parsedProductInfo,
        analysis: {
          sustainabilityCriticism: analysis.sustainabilityCriticism,
          alternativeProducts: analysis.alternativeProducts.slice(0, 3), // Limit to 3 alternatives
          sustainabilityScore: analysis.sustainabilityScore,
          recommendations: analysis.recommendations
        }
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Evaluation error:', error);
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to evaluate product',
      details: error.message
    });
  }
});

module.exports = router; 