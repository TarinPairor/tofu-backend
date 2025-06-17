const express = require('express');
const recommend = require('../controllers/recommendController');

const router = express.Router();

// POST route example
router.post('/', recommend);

module.exports = router;