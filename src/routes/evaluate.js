const express = require('express');
const evaluate = require('../controllers/evaluateController');

const router = express.Router();

// POST route example
router.post('/evaluate', evaluate);

module.exports = router;