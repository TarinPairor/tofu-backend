const express = require('express');
const router = express.Router();
const { scrapeContent } = require('../utils/scraper');

router.post('/', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const content = await scrapeContent(url);

    res.json({
      success: true,
      data: JSON.parse(content)  // Parse the JSON string back to an object
    });

  } catch (error) {
    console.error('Error:', error);
    
    // Handle specific error types
    if (error.message === 'Invalid URL format') {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }

    if (error.message === 'SONAR_API_KEY is required') {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: Sonar API key not found'
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Failed to process URL',
      details: error.message
    });
  }
});

module.exports = router;