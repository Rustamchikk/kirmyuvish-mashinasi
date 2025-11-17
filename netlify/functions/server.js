const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Sizning mavjud route laringizni bu yerga qo'ying
app.get('/api', (req, res) => {
  res.json({ message: 'Washing Machine API is working!' });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Netlify Functions uchun
exports.handler = serverless(app);