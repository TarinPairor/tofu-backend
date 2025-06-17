const express = require('express');
const router = express.Router();
const { scrapeContent } = require('../utils/scraper');

router.post('/', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const content = await scrapeContent(url, process.env.OPENAI_API_KEY);

    res.json({
      success: true,
      data: content
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

    res.status(500).json({ 
      success: false,
      error: 'Failed to process URL',
      details: error.message
    });
  }
});

module.exports = router;