const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const cheerio = require('cheerio');

router.post('/', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log(process.env.OPENAI_API_KEY);

    // Fetch webpage content
    const response = await fetch(url);
    const html = await response.text();

    // Extract text content from HTML
    const $ = cheerio.load(html);
    
    // Remove script and style elements
    $('script').remove();
    $('style').remove();
    
    // Get main content areas, prioritizing product-related sections
    const mainContent = $('main, [class*="product"], [class*="description"], [id*="product"], [id*="description"]').text().trim();
    let textContent = mainContent || $('body').text().trim();
    
    // Limit text content to approximately 2000 tokens (roughly 8000 characters)
    textContent = textContent.substring(0, 8000);

    // Use OpenAI to analyze the content with structured output
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a product information extractor. Analyze the text and return a JSON object with the following structure: {\"product_name\": string, \"product_description\": string, \"key_features\": string[]}. If no clear product information is found, return {\"product_name\": \"\", \"product_description\": \"\", \"key_features\": []}."
        },
        {
          role: "user",
          content: `Analyze this product text and return structured data: ${textContent}`
        }
      ],
    });

    // Parse the response as JSON, with error handling
    let analysisData;
    try {
      analysisData = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      return res.status(500).json({
        success: false,
        error: 'Failed to parse product data',
        details: 'Invalid response format from analysis'
      });
    }

    res.json({
      success: true,
      data: analysisData
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to process URL',
      details: error.message
    });
  }
});

module.exports = router;