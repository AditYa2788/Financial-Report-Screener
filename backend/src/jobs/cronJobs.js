const cron = require('node-cron');
const { ingestCompany } = require('../routes/filings');
const { computeTrendingKeywords } = require('../routes/keywords');

// Core set of companies to track automatically
const TRACKED = [
  { cik: '320193',  ticker: 'AAPL',  name: 'Apple Inc.' },
  { cik: '789019',  ticker: 'MSFT',  name: 'Microsoft Corp.' },
  { cik: '1018724', ticker: 'AMZN',  name: 'Amazon.com Inc.' },
  { cik: '1652044', ticker: 'GOOGL', name: 'Alphabet Inc.' },
  { cik: '1326801', ticker: 'META',  name: 'Meta Platforms Inc.' },
  { cik: '1318605', ticker: 'TSLA',  name: 'Tesla Inc.' },
  { cik: '731819',  ticker: 'JNJ',   name: 'Johnson & Johnson' },
  { cik: '78003',   ticker: 'PG',    name: 'Procter & Gamble Co.' },
  { cik: '51143',   ticker: 'IBM',   name: 'IBM Corp.' },
  { cik: '886982',  ticker: 'V',     name: 'Visa Inc.' }
];

function initCronJobs() {
  // Daily 6AM: check for new 10-Ks
  cron.schedule('0 6 * * *', async () => {
    console.log('[CRON] 10-K ingestion pass');
    for (const co of TRACKED) {
      await ingestCompany(co, '10-K');
    }
  });

  // Daily 8AM: check for new 8-Ks (earnings releases)
  cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] 8-K ingestion pass');
    for (const co of TRACKED) {
      await ingestCompany(co, '8-K');
    }
  });

  // Every 6 hours: recompute trending keywords
  cron.schedule('0 */6 * * *', async () => {
    console.log('[CRON] Computing trending keywords');
    try { await computeTrendingKeywords(); }
    catch (err) { console.error('[CRON] keyword compute error:', err.message); }
  });

  console.log('[CRON] Jobs scheduled');
}

module.exports = { initCronJobs, TRACKED };
