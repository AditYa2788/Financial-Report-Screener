const Redis = require('ioredis');

let client = null;

function getClient() {
  if (!client && process.env.REDIS_URL) {
    client = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 5000
    });
    client.on('error', () => { client = null; });
  }
  return client;
}

async function cacheGet(key) {
  try {
    const r = getClient();
    if (!r) return null;
    const val = await r.get(key);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
}

async function cacheSet(key, value, ttlSeconds = 3600) {
  try {
    const r = getClient();
    if (!r) return;
    await r.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {}
}

module.exports = { cacheGet, cacheSet };
