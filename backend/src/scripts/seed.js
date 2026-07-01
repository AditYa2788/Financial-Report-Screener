/**
 * Seed the database with realistic sample data so the dashboard works
 * immediately without waiting for EDGAR scraping.
 * Run: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Filing = require('../models/Filing');
const Company = require('../models/Company');
const TrendingKeyword = require('../models/TrendingKeyword');
const tfidf = require('../processors/tfidf');
const { processText } = require('../processors/textProcessor');

const COMPANIES = [
  { cik: '320193',  ticker: 'AAPL',  name: 'Apple Inc.',           sector: 'Technology' },
  { cik: '789019',  ticker: 'MSFT',  name: 'Microsoft Corp.',      sector: 'Technology' },
  { cik: '1018724', ticker: 'AMZN',  name: 'Amazon.com Inc.',      sector: 'Consumer Discretionary' },
  { cik: '1652044', ticker: 'GOOGL', name: 'Alphabet Inc.',        sector: 'Technology' },
  { cik: '1326801', ticker: 'META',  name: 'Meta Platforms Inc.',  sector: 'Technology' },
  { cik: '1318605', ticker: 'TSLA',  name: 'Tesla Inc.',           sector: 'Consumer Discretionary' },
  { cik: '731819',  ticker: 'JNJ',   name: 'Johnson & Johnson',    sector: 'Healthcare' },
  { cik: '78003',   ticker: 'PG',    name: 'Procter & Gamble Co.', sector: 'Consumer Staples' }
];

const SAMPLE_PARAGRAPHS = {
  AAPL: [
    "Our iPhone revenue increased 8% year-over-year driven by strong demand for the iPhone 15 Pro lineup. The average selling price improved due to favorable product mix as customers upgraded to higher-tier models. We saw particularly strong performance in emerging markets including India where revenue grew 33% annually.",
    "Supply chain resilience has improved significantly following our strategic diversification initiatives. We have expanded manufacturing partnerships in India and Vietnam, reducing our dependence on any single geography. Component lead times have normalized and inventory levels are healthy heading into the December quarter.",
    "Services revenue reached a new all-time high of $24.2 billion, growing 16% year-over-year. The App Store, Apple Music, Apple TV+, iCloud, and Apple Pay all contributed to record performance. Our installed base of active devices surpassed 2.2 billion units, providing a strong foundation for continued Services growth.",
    "Gross margins expanded to 45.9%, reflecting operating leverage and favorable pricing dynamics in our Services segment. We continue to invest aggressively in research and development, with R&D expense up 11% as we advance technologies including artificial intelligence, augmented reality, and silicon engineering.",
    "We returned over $25 billion to shareholders during the quarter through dividends and share repurchases. Our balance sheet remains strong with $166 billion in cash and marketable securities, providing substantial flexibility for capital allocation and strategic investments in future growth opportunities."
  ],
  MSFT: [
    "Microsoft Cloud revenue surpassed $37 billion for the quarter, growing 24% year-over-year. Azure and other cloud services revenue grew 29%, accelerating from the prior quarter as AI services drive incremental workloads. Our commercial bookings grew 17% and the commercial remaining performance obligation increased to $259 billion.",
    "Copilot integration across our product portfolio is generating measurable productivity improvements for enterprise customers. We have now embedded generative AI capabilities across Microsoft 365, GitHub, Dynamics 365, and Azure. Early adopters report 20-30% efficiency gains in software development and content creation workflows.",
    "Gaming revenue grew 51% driven by the Activision Blizzard acquisition integration. Xbox Game Pass subscriber growth accelerated and we saw record engagement across our gaming platforms. The integration of Activision's intellectual property with Game Pass represents a significant content advantage.",
    "Operating income increased 25% to $29.1 billion with operating margins expanding 120 basis points. We have maintained disciplined expense management while continuing to invest in strategic growth areas. Our productivity and business processes segment achieved 13% revenue growth driven by continued Office 365 adoption.",
    "The enterprise AI opportunity remains substantial and we believe we are in the early innings of a multiyear investment cycle. Customer demand for AI infrastructure and application development tools continues to outpace supply. We expect capital expenditure to remain elevated as we build out datacenter capacity globally."
  ],
  TSLA: [
    "Vehicle deliveries reached 484,507 units in the quarter, representing our highest quarterly delivery volume ever. The Model Y remained the best-selling vehicle globally across all categories. Delivery growth was supported by continued price optimization and improved manufacturing efficiency across our production facilities.",
    "Automotive gross margin faced headwinds from pricing adjustments and increased warranty provisions, coming in at 17.9%. We have implemented significant cost reduction initiatives across our manufacturing operations and remain confident in our ability to return to 20%+ margins as volumes scale and Cybertruck production ramps.",
    "Our energy generation and storage business achieved record quarterly revenue of $1.6 billion, growing 40% year-over-year. The Megapack factory in Lathrop reached full production capacity and we are seeing strong demand from utilities and commercial customers for grid-scale storage solutions as energy transition accelerates.",
    "Full Self-Driving supervised miles have grown to over 600 million cumulative miles with the fleet accumulating real-world driving data at unprecedented scale. The neural network improvements in FSD version 12 have demonstrated step-function improvements in handling complex urban driving scenarios without driver intervention.",
    "We are making substantial investments in lithium refining, cathode manufacturing, and cell production to vertically integrate our supply chain. These investments will reduce per-unit costs and ensure supply security as we scale toward our 20 million annual vehicle production target by the end of the decade."
  ],
  AMZN: [
    "AWS revenue grew 17% to $24.2 billion, with operating income increasing 61% to $7.2 billion. The acceleration in AWS growth reflects customers recommitting to cloud migration projects after a period of optimization. Generative AI services are becoming an increasingly meaningful revenue contributor with AWS Bedrock seeing strong enterprise adoption.",
    "North America segment operating income reached $5.0 billion with operating margins expanding to 5.6%, reflecting the benefits of our transportation network buildout and continued cost improvements in our fulfillment operations. We are seeing the results of our regionalized fulfillment strategy with significant improvements in delivery speed and cost efficiency.",
    "Advertising services revenue grew 27% to $14.7 billion, demonstrating the continued strength of our sponsored products and display advertising businesses. The growth in Prime Video advertising following our introduction of ads represents a significant incremental revenue opportunity that we are only beginning to monetize.",
    "Our grocery business is growing rapidly with Prime members increasingly using Amazon Fresh and Whole Foods Market for weekly shopping. We have significantly improved our fresh grocery delivery economics and are expanding our fulfillment capabilities for perishable items. We believe grocery represents one of our largest long-term opportunities.",
    "We have made the strategic decision to invest aggressively in artificial intelligence infrastructure, model development, and application integration across all our businesses. The AI opportunity is transformational and we intend to be a leader across foundation models, developer tools, and AI-powered applications for both businesses and consumers."
  ]
};

async function buildFilingData(company, paragraphTexts, daysAgo) {
  const processed = tfidf.processFilingParagraphs(paragraphTexts);
  const topKeywords = tfidf.extractFilingKeywords(processed, 40);
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);

  return {
    accessionNumber: `0000${company.cik}-24-${String(Math.floor(Math.random() * 900000) + 100000)}`,
    cik: company.cik,
    companyName: company.name,
    ticker: company.ticker,
    filingType: '10-K',
    filedAt: date,
    reportPeriod: date,
    paragraphs: processed,
    topKeywords,
    paragraphCount: processed.length,
    wordCount: processed.reduce((s, p) => s + (p.wordCount || 0), 0),
    processedAt: new Date(),
    processingStatus: 'completed'
  };
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Filing.deleteMany({}),
      Company.deleteMany({}),
      TrendingKeyword.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Insert companies
    await Company.insertMany(COMPANIES.map(c => ({
      ...c,
      exchange: 'NASDAQ',
      lastFiled: new Date(),
      filingCount: 1
    })));
    console.log(`Inserted ${COMPANIES.length} companies`);

    // Insert filings
    const filingData = [];
    const tickers = Object.keys(SAMPLE_PARAGRAPHS);
    for (let i = 0; i < tickers.length; i++) {
      const ticker = tickers[i];
      const company = COMPANIES.find(c => c.ticker === ticker);
      if (!company) continue;
      const data = await buildFilingData(company, SAMPLE_PARAGRAPHS[ticker], i * 3);
      filingData.push(data);
    }

    await Filing.insertMany(filingData);
    console.log(`Inserted ${filingData.length} filings`);

    // Build term map from seeded filings
    const termMap = {};
    filingData.forEach(f => {
      f.topKeywords.forEach(({ term, score }) => {
        if (!termMap[term]) termMap[term] = { total: 0, count: 0, companies: [] };
        termMap[term].total += score;
        termMap[term].count++;
        if (!termMap[term].companies.includes(f.ticker)) termMap[term].companies.push(f.ticker);
      });
    });

    const topTerms = Object.entries(termMap)
      .sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))
      .slice(0, 40);

    // Generate 30 days of history with slight trend + noise so charts look realistic
    const HISTORY_DAYS = 30;
    const allKeywordDocs = [];

    for (let d = HISTORY_DAYS; d >= 0; d--) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      date.setHours(0, 0, 0, 0);

      topTerms.forEach(([term, data]) => {
        const base = data.total / data.count;
        // Gentle upward drift over 30 days + random noise
        const drift = ((HISTORY_DAYS - d) / HISTORY_DAYS) * 0.25;
        const noise = (Math.random() - 0.5) * 0.12;
        allKeywordDocs.push({
          date: new Date(date),
          term,
          score: parseFloat(Math.max(0.001, base * (1 + drift + noise)).toFixed(4)),
          filingCount: data.count,
          companies: data.companies
        });
      });
    }

    await TrendingKeyword.insertMany(allKeywordDocs);
    console.log(`Inserted ${allKeywordDocs.length} keyword data points (${HISTORY_DAYS + 1} days × ${topTerms.length} terms)`);

    console.log('\nSeed complete. Dashboard is ready.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
