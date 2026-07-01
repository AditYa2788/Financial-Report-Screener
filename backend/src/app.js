require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const searchRoutes = require('./routes/search');
const filingsRoutes = require('./routes/filings');
const keywordsRoutes = require('./routes/keywords');
const { initCronJobs } = require('./jobs/cronJobs');

const app = express();

connectDB();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/search', searchRoutes);
app.use('/api/filings', filingsRoutes);
app.use('/api/keywords', keywordsRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (process.env.NODE_ENV !== 'test') initCronJobs();
});

module.exports = app;
