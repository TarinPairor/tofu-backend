const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();
require('dotenv').config();

/**
 * Generates store recommendations for a given product
 * @param {string} product - The product name to get recommendations for
 * @returns {Promise<Object>} Recommendations and sustainability tips
 */
async function getRecommendations(product) {
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
            content: "You are a sustainable shopping expert. Given a product, recommend up to 3 sustainable stores that sell similar products. Return ONLY a JSON object with this exact format: {\"productName\": \"input product name\", \"storeRecommendations\": [{\"storeName\": \"store name\", \"sustainabilityScore\": number from 1-10, \"reasons\": [\"reason1\", \"reason2\"], \"productPrice\": \"price range\", \"sustainabilityInitiatives\": [\"initiative1\", \"initiative2\"], \"productLink\": \"https://store.com/product\"}], \"sustainabilityTips\": [\"tip1\", \"tip2\"]}"
          },
          {
            role: "user",
            content: `Find sustainable stores that sell: ${product}`
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

    const recommendations = JSON.parse(content);

    // Validate the recommendations structure
    if (!recommendations.productName || !Array.isArray(recommendations.storeRecommendations) || 
        !Array.isArray(recommendations.sustainabilityTips) || 
        !recommendations.storeRecommendations.every(store => 
          store.storeName && 
          typeof store.sustainabilityScore === 'number' &&
          Array.isArray(store.reasons) &&
          typeof store.productPrice === 'string' &&
          Array.isArray(store.sustainabilityInitiatives)
        )) {
      throw new Error('Invalid recommendations format');
    }

    // Ensure we have at most 3 recommendations
    recommendations.storeRecommendations = recommendations.storeRecommendations.slice(0, 3);

    return recommendations;
  } catch (error) {
    console.error('Recommendations error:', error);
    throw error;
  }
}

router.post('/', async (req, res) => {
  try {
    const { product } = req.body;
    if (!product) {
      return res.status(400).json({ 
        success: false, 
        error: 'Product name is required' 
      });
    }

    const recommendations = await getRecommendations(product);

    res.json({
      success: true,
      data: recommendations
    });

  } catch (error) {
    console.error('Recommendation error:', error);
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to get recommendations',
      details: error.message
    });
  }
});

module.exports = router;