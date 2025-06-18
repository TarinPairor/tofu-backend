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
            content: "You are a sustainable fashion expert. Analyze the product, criticize its sustainability aspects in terms of materials & sourcing, production & manufacturing, distribution & logistics, product use and end of life management. Give at least 1 criticism per aspect. Return ONLY a JSON object with the following structure: {\"sustainabilityCriticism\": [{\"criticism\": \"criticism text\", \"citation\": \"source URL\", \"citation_number\": number}], \"alternativeProducts\": [{\"name\": \"product brand and name\", \"reason\": \"why it's more sustainable\", \"citation\": \"source URL\", \"citation_number\": number, \"product_link\": \"URL to purchase\"}], \"sustainabilityScore_materialsAndSourcing\": number from 1-10, \"sustainabilityScore_productionAndManufacturing\": number from 1-10, \"sustainabilityScore_distributionAndLogistics\": number from 1-10, \"sustainabilityScore_productUse\": number from 1-10, \"sustainabilityScore_endOfLifeManagement\": number from 1-10, \"recommendations\": [{\"recommendation\": \"recommendation text\", \"citation\": \"source URL\", \"citation_number\": number}]}"
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

    console.log('Analysis result:', analysis);
    // Validate the analysis structure
    if (!analysis.sustainabilityCriticism || !analysis.alternativeProducts || 
        !analysis.sustainabilityScore_materialsAndSourcing || 
        !analysis.sustainabilityScore_productionAndManufacturing || 
        !analysis.sustainabilityScore_distributionAndLogistics || 
        !analysis.sustainabilityScore_productUse || 
        !analysis.sustainabilityScore_endOfLifeManagement || !analysis.recommendations ||
        !analysis.sustainabilityCriticism[0]?.citation ||
        !analysis.alternativeProducts[0]?.citation ||
        !analysis.recommendations[0]?.citation ||
        !analysis.alternativeProducts[0]?.product_link) {
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
          sustainabilityScore: (analysis.sustainabilityScore_materialsAndSourcing +
            analysis.sustainabilityScore_productionAndManufacturing +
            analysis.sustainabilityScore_distributionAndLogistics +
            analysis.sustainabilityScore_productUse +
            analysis.sustainabilityScore_endOfLifeManagement) / 5,
          sustainabilityScore_materialsAndSourcing : analysis.sustainabilityScore_materialsAndSourcing,
          sustainabilityScore_productionAndManufacturing : analysis.sustainabilityScore_productionAndManufacturing,
          sustainabilityScore_distributionAndLogistics : analysis.sustainabilityScore_distributionAndLogistics,
          sustainabilityScore_productUse : analysis.sustainabilityScore_productUse,
          sustainabilityScore_endOfLifeManagement : analysis.sustainabilityScore_endOfLifeManagement,
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