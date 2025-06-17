const express = require('express');
const { request_model } = require('../utils/request_model');

const router = express.Router();

// POST route example
router.post('/evaluate', request_model);

module.exports = router;