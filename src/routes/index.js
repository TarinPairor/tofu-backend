const express = require('express');
const router = express.Router();

// Middleware specific to these routes
router.use((req, res, next) => {
  console.log('Request received:', req.method, req.url);
  next();
});

// GET /
router.get('/', (req, res) => {
  res.json({ message: 'Hi! This is the Sustainability Assessment API. Submit a POST request to /evaluate with a URL to get started.' });
});

module.exports = router; 