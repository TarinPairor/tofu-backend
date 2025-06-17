require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

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
const evalRouter = require('./routes/eval');
const addProductRouter = require('./routes/add-product');

// Routes
app.use('/eval', evalRouter);
app.use('/add-product', addProductRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    error: 'Something broke!',
    details: err.message 
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Connect to http://localhost:${port}`)
}); 