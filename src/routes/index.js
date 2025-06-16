const express = require('express');
const router = express.Router();

// Middleware specific to these routes
router.use((req, res, next) => {
  console.log('Request received:', req.method, req.url);
  next();
});

// GET /
router.get('/', (req, res) => {
  res.json({ message: 'Hello' });
});

// GET /:id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({ message: `Hello ${id}` });
});

module.exports = router; 