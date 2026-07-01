const { processText } = require('./textProcessor');
const tfidf = require('./tfidf');

function cosine(vecA, vecB) {
  if (!vecA || !vecB) return 0;
  let dot = 0, magA = 0, magB = 0;
  Object.entries(vecA).forEach(([term, a]) => {
    const b = vecB[term] || 0;
    dot += a * b;
    magA += a * a;
  });
  Object.values(vecB).forEach(b => { magB += b * b; });
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// Search paragraphs array for query, returns top N with similarity scores
function searchParagraphs(queryText, paragraphs, topN = 10) {
  // Build the query vector using the current IDF state of the processor
  const qVec = tfidf.queryVector(queryText);
  if (!Object.keys(qVec).length) return [];

  return paragraphs
    .map(para => ({
      ...para,
      similarity: cosine(qVec, para.tfidfVector || {})
    }))
    .filter(p => p.similarity > 0.01)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN);
}

module.exports = { cosine, searchParagraphs };
