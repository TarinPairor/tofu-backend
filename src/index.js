const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/', require('./routes/index'));
app.use('/posts', require('./routes/posts'));
app.use('/scrape', require('./routes/scrape'));
app.use('/eval', require('./routes/eval'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Connect to http://localhost:${port}`)
}); 