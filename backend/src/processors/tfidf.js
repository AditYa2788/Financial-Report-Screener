const { processText } = require('./textProcessor');

class TFIDFProcessor {
  constructor() {
    this.documentFrequency = {};
    this.totalDocuments = 0;
  }

  computeTF(tokens) {
    const tf = {};
    tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
    const len = tokens.length || 1;
    Object.keys(tf).forEach(term => { tf[term] /= len; });
    return tf;
  }

  // Rebuild IDF from a corpus of tokenized documents
  buildCorpus(tokenizedDocs) {
    this.totalDocuments = tokenizedDocs.length;
    this.documentFrequency = {};
    tokenizedDocs.forEach(tokens => {
      new Set(tokens).forEach(term => {
        this.documentFrequency[term] = (this.documentFrequency[term] || 0) + 1;
      });
    });
  }

  idf(term) {
    const df = this.documentFrequency[term] || 0;
    // Smoothed IDF: log((N+1)/(df+1)) + 1
    return Math.log((this.totalDocuments + 1) / (df + 1)) + 1;
  }

  // Returns sparse TF-IDF vector (top 100 terms only for storage efficiency)
  vectorize(tokens, topN = 100) {
    const tf = this.computeTF(tokens);
    const scored = Object.entries(tf).map(([term, tfScore]) => [
      term,
      tfScore * this.idf(term)
    ]);
    // Sort by score desc, keep top N
    scored.sort((a, b) => b[1] - a[1]);
    const vector = {};
    scored.slice(0, topN).forEach(([term, score]) => {
      vector[term] = score;
    });
    return vector;
  }

  // Process all paragraphs of a filing together so IDF is document-aware
  processFilingParagraphs(paragraphTexts) {
    const tokenized = paragraphTexts.map(t => processText(t));
    this.buildCorpus(tokenized);
    return tokenized.map((tokens, idx) => ({
      index: idx,
      text: paragraphTexts[idx],
      tfidfVector: this.vectorize(tokens),
      wordCount: tokens.length
    }));
  }

  // Aggregate top keywords across all paragraph vectors for a filing
  extractFilingKeywords(processedParagraphs, n = 40) {
    const merged = {};
    processedParagraphs.forEach(p => {
      Object.entries(p.tfidfVector).forEach(([term, score]) => {
        if (!merged[term] || score > merged[term]) merged[term] = score;
      });
    });
    return Object.entries(merged)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([term, score]) => ({ term, score: parseFloat(score.toFixed(4)) }));
  }

  // Build a query vector using current IDF state
  queryVector(queryText) {
    const tokens = processText(queryText);
    if (!tokens.length) return {};
    // Use sub-linear TF for queries
    const tf = {};
    tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
    const vector = {};
    Object.entries(tf).forEach(([term, count]) => {
      vector[term] = (1 + Math.log(count)) * this.idf(term);
    });
    return vector;
  }
}

// Singleton - used app-wide
const processor = new TFIDFProcessor();
module.exports = processor;
