import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000
});

export const searchFilings = (q, params = {}) =>
  api.get('/search', { params: { q, ...params } }).then(r => r.data);

export const searchWithinFiling = (accessionNumber, q) =>
  api.get(`/search/filing/${accessionNumber}`, { params: { q } }).then(r => r.data);

export const getFilings = (params = {}) =>
  api.get('/filings', { params }).then(r => r.data);

export const getFilingStats = () =>
  api.get('/filings/stats/overview').then(r => r.data);

export const getTrendingKeywords = (params = {}) =>
  api.get('/keywords/trending', { params }).then(r => r.data);

export const getKeywordHistory = (params = {}) =>
  api.get('/keywords/history', { params }).then(r => r.data);

export const ingestCompany = (data) =>
  api.post('/filings/ingest', data).then(r => r.data);
