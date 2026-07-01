const axios = require('axios');
const { cleanText } = require('../processors/textProcessor');

const SEC_BASE = 'https://www.sec.gov';
const DATA_BASE = 'https://data.sec.gov';
const SEARCH_BASE = 'https://efts.sec.gov/LATEST/search-index';

// SEC requires a descriptive User-Agent
const ua = process.env.SEC_USER_AGENT || 'FinancialScreener contact@example.com';

// Rate limiter: stay under 10 req/s
let _lastReq = 0;
async function get(url) {
  const gap = Date.now() - _lastReq;
  if (gap < 120) await delay(120 - gap);
  _lastReq = Date.now();
  const res = await axios.get(url, {
    headers: { 'User-Agent': ua },
    timeout: 30000
  });
  return res.data;
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function today() { return new Date().toISOString().slice(0, 10); }
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// Fetch company submissions (filing history) by CIK
async function fetchCompanyFilings(cik, formType = '10-K', limit = 3) {
  try {
    const paddedCik = cik.toString().padStart(10, '0');
    const data = await get(`${DATA_BASE}/submissions/CIK${paddedCik}.json`);
    const f = data.filings?.recent;
    if (!f) return [];

    const results = [];
    for (let i = 0; i < f.form.length && results.length < limit; i++) {
      if (f.form[i] === formType) {
        results.push({
          accessionNumber: f.accessionNumber[i],
          filingDate: f.filingDate[i],
          reportDate: f.reportDate[i] || null,
          form: f.form[i],
          primaryDocument: f.primaryDocument[i],
          cik: cik.toString(),
          companyName: data.name,
          ticker: data.tickers?.[0] || ''
        });
      }
    }
    return results;
  } catch (err) {
    console.error(`EDGAR fetchCompanyFilings(${cik}): ${err.message}`);
    return [];
  }
}

// Fetch the raw text of a filing document
async function fetchFilingDocument(cik, accessionNumber, primaryDocument) {
  try {
    const accFmt = accessionNumber.replace(/-/g, '');
    const url = `${SEC_BASE}/Archives/edgar/data/${cik}/${accFmt}/${primaryDocument}`;
    const html = await get(url);
    return cleanText(typeof html === 'string' ? html : JSON.stringify(html));
  } catch (err) {
    console.error(`fetchFilingDocument(${accessionNumber}): ${err.message}`);
    return null;
  }
}

// Full-text search on EDGAR
async function searchEDGAR(query, formType = '10-K', limit = 10) {
  try {
    const q = encodeURIComponent(query);
    const data = await get(
      `${SEARCH_BASE}?q=${q}&forms=${formType}&dateRange=custom&startdt=${daysAgo(365)}&enddt=${today()}`
    );
    return (data?.hits?.hits || []).slice(0, limit);
  } catch (err) {
    console.error(`searchEDGAR: ${err.message}`);
    return [];
  }
}

// Pull the company ticker list from SEC (first 100 by CIK)
async function fetchPopularCompanies(count = 100) {
  try {
    const data = await get(`${SEC_BASE}/files/company_tickers.json`);
    return Object.values(data).slice(0, count).map(c => ({
      cik: c.cik_str.toString(),
      ticker: c.ticker,
      name: c.title
    }));
  } catch (err) {
    console.error(`fetchPopularCompanies: ${err.message}`);
    return [];
  }
}

module.exports = {
  fetchCompanyFilings,
  fetchFilingDocument,
  searchEDGAR,
  fetchPopularCompanies
};
