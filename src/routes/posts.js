const express = require('express');
const router = express.Router();

// Middleware specific to posts routes
router.use((req, res, next) => {
  console.log('Posts route accessed:', req.method, req.url);
  next();
});

// GET /posts/:id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    id,
    title: `Post ${id}`,
    content: `This is the content of post ${id}`,
    createdAt: new Date().toISOString()
  });
});

module.exports = router; 