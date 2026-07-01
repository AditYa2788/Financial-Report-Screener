const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','from','up','about','into','through','during','is','are','was','were',
  'be','been','being','have','has','had','do','does','did','will','would',
  'could','should','may','might','shall','can','this','that','these','those',
  'it','its','we','our','they','their','he','she','his','her','you','your',
  'i','me','my','us','him','them','who','which','what','when','where','how',
  'all','each','every','both','few','more','most','other','some','such','no',
  'nor','not','only','own','same','so','than','too','very','s','t','just',
  'because','as','until','while','although','since','before','after','if',
  'any','also','there','then','between','over','under','again','further',
  'once','here','why','both','few','now','during','above','below',
  'per','said','also','whether','however','therefore','thus','hence',
  'whereas','accordingly','consequently','nevertheless','nonetheless',
  'pursuant','herein','thereof','thereto','hereof','hereby','therefrom'
]);

function cleanText(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#\d+;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitIntoParagraphs(text) {
  // Split on double newlines, section breaks, or long whitespace
  return text
    .split(/\n{2,}|\r\n\r\n|\t{2,}/)
    .map(p => p.replace(/\s+/g, ' ').trim())
    .filter(p => {
      const wordCount = p.split(/\s+/).length;
      return wordCount >= 20 && wordCount <= 2000 && p.length > 100;
    });
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token =>
      token.length > 2 &&
      token.length < 25 &&
      !STOP_WORDS.has(token) &&
      !/^\d+$/.test(token)
    );
}

// Lightweight suffix-stripping stemmer
function stem(word) {
  if (word.endsWith('ational')) return word.slice(0, -7) + 'ate';
  if (word.endsWith('tional')) return word.slice(0, -6) + 'tion';
  if (word.endsWith('enci')) return word.slice(0, -4) + 'ence';
  if (word.endsWith('anci')) return word.slice(0, -4) + 'ance';
  if (word.endsWith('izer')) return word.slice(0, -4) + 'ize';
  if (word.endsWith('ising') && word.length > 6) return word.slice(0, -3);
  if (word.endsWith('izing') && word.length > 6) return word.slice(0, -3);
  if (word.endsWith('ation') && word.length > 6) return word.slice(0, -5) + 'ate';
  if (word.endsWith('ations') && word.length > 7) return word.slice(0, -6) + 'ate';
  if (word.endsWith('alities') && word.length > 8) return word.slice(0, -7) + 'al';
  if (word.endsWith('ness') && word.length > 6) return word.slice(0, -4);
  if (word.endsWith('ment') && word.length > 6) return word.slice(0, -4);
  if (word.endsWith('ments') && word.length > 7) return word.slice(0, -5);
  if (word.endsWith('ing') && word.length > 6) return word.slice(0, -3);
  if (word.endsWith('ingly') && word.length > 7) return word.slice(0, -5);
  if (word.endsWith('ated') && word.length > 6) return word.slice(0, -4) + 'ate';
  if (word.endsWith('ful') && word.length > 5) return word.slice(0, -3);
  if (word.endsWith('ous') && word.length > 5) return word.slice(0, -3);
  if (word.endsWith('ive') && word.length > 5) return word.slice(0, -3);
  if (word.endsWith('ize') && word.length > 5) return word.slice(0, -3);
  if (word.endsWith('ise') && word.length > 5) return word.slice(0, -3);
  if (word.endsWith('ers') && word.length > 5) return word.slice(0, -2);
  if (word.endsWith('ed') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('ly') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('er') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('al') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('ies') && word.length > 5) return word.slice(0, -3) + 'y';
  if (word.endsWith('s') && word.length > 4 && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

function processText(text) {
  return tokenize(text).map(stem);
}

module.exports = { cleanText, splitIntoParagraphs, tokenize, stem, processText, STOP_WORDS };
