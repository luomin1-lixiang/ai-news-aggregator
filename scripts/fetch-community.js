require('dotenv').config();
const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// RSS sources: Reddit subreddits + GitHub releases
const COMMUNITY_FEEDS = [
  {
    url: 'https://www.reddit.com/r/ClaudeAI/new.rss',
    name: 'r/ClaudeAI',
    sourceType: 'reddit',
    category: 'reddit',
    filterKeywords: true,
  },
  {
    url: 'https://www.reddit.com/r/AnthropicAI/new.rss',
    name: 'r/AnthropicAI',
    sourceType: 'reddit',
    category: 'reddit',
    filterKeywords: true,
  },
  {
    url: 'https://github.com/anthropics/claude-code/releases.atom',
    name: 'Claude Code Releases',
    sourceType: 'github-release',
    category: 'github-release',
    filterKeywords: false, // all releases are relevant
  },
];

// Keywords to filter Reddit posts (Claude Code related)
const CLAUDE_CODE_KEYWORDS = [
  'claude code', 'claude-code', 'claude code cli',
  'mcp', 'mcp server', 'computer use',
  'hooks', '.claude', 'claude_desktop',
  'claude desktop', 'claude api', 'anthropic api',
  'claude 3', 'claude 4', 'sonnet', 'haiku', 'opus',
  'new feature', 'update', 'release', 'version',
  'bug', 'fix', 'tip', 'trick', 'workflow',
];

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; AI-News-Aggregator/1.0)',
    'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml',
  },
  timeout: 20000,
  customFields: {
    item: [
      ['content:encoded', 'contentEncoded'],
      ['media:thumbnail', 'mediaThumbnail'],
    ],
  },
});

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isClaudeCodeRelated(title, description) {
  const text = (title + ' ' + description).toLowerCase();
  return CLAUDE_CODE_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
}

function stripHtml(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Translate title to Chinese via DeepSeek
async function translateTitle(title, retries = 3) {
  if (!DEEPSEEK_API_KEY) return title;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'Translate the following title into Chinese. Return only the translation, no extra text. Keep technical terms like "Claude Code", "MCP", "API" in English.' },
            { role: 'user', content: title },
          ],
          max_tokens: 200,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        if (attempt < retries - 1) { await delay(Math.pow(2, attempt) * 1000); continue; }
        return title;
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || title;
    } catch (error) {
      if (attempt < retries - 1) { await delay(Math.pow(2, attempt) * 1000); continue; }
      return title;
    }
  }
  return title;
}

// Summarize content to Chinese via DeepSeek
async function summarizeContent(title, content, sourceType, retries = 3) {
  if (!DEEPSEEK_API_KEY) return null;

  const isShort = content.length < 300;

  let systemPrompt;
  if (sourceType === 'github-release') {
    systemPrompt = 'You are a tech journalist. Summarize the following Claude Code release notes into a clear Chinese summary (300-600 characters). Highlight: new features, bug fixes, breaking changes. Keep version numbers and technical terms in English.';
  } else if (isShort) {
    systemPrompt = 'Translate the following Reddit post into fluent Chinese. Keep technical terms in English.';
  } else {
    systemPrompt = 'You are a tech journalist. Summarize the following Reddit post into a concise Chinese summary (300-500 characters). Capture the main question/topic, key insights, and community reactions if present. Keep technical terms in English.';
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log(`  📡 [DeepSeek] Attempt ${attempt + 1}: "${title.substring(0, 50)}..."`);

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Title: ${title}\n\nContent:\n${content.substring(0, 6000)}` },
          ],
          max_tokens: 1000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error(`  ❌ [DeepSeek] Error (${response.status}): ${err.substring(0, 200)}`);
        if (attempt < retries - 1) { await delay(Math.pow(2, attempt) * 1000); continue; }
        return null;
      }

      const data = await response.json();
      const summary = data.choices?.[0]?.message?.content?.trim();
      console.log(`  ✅ [DeepSeek] Done: ${summary?.length || 0} chars, tokens=${JSON.stringify(data.usage)}`);
      return summary || null;
    } catch (error) {
      console.error(`  ❌ [DeepSeek] Request error: ${error.message}`);
      if (attempt < retries - 1) { await delay(Math.pow(2, attempt) * 1000); continue; }
      return null;
    }
  }
  return null;
}

async function fetchFeed(feedConfig) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📡 Fetching: ${feedConfig.name}`);

  try {
    const feed = await parser.parseURL(feedConfig.url);
    console.log(`  Found ${feed.items.length} items`);

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const items = [];

    for (const item of feed.items) {
      const pubDate = new Date(item.pubDate || item.isoDate || item.updated);

      // Skip items older than 24 hours
      if (pubDate < twentyFourHoursAgo) continue;

      const rawContent = stripHtml(item.contentEncoded || item.content || item.summary || item.description || '');
      const title = item.title || '';

      // Filter Reddit posts by keyword relevance
      if (feedConfig.filterKeywords && !isClaudeCodeRelated(title, rawContent)) {
        continue;
      }

      items.push({
        title,
        rawContent,
        link: item.link || item.id || '',
        author: typeof item.author === 'string' ? item.author : (item.creator || feedConfig.name),
        pubDate: pubDate.toISOString(),
        source: feedConfig.name,
        sourceType: feedConfig.sourceType,
        category: feedConfig.category,
      });
    }

    console.log(`  Relevant items: ${items.length}`);
    return items;
  } catch (error) {
    console.error(`  ❌ Fetch failed: ${error.message}`);
    return [];
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🌐 Community feed fetch started');
  console.log('='.repeat(60));

  const allRawItems = [];

  for (const feedConfig of COMMUNITY_FEEDS) {
    const items = await fetchFeed(feedConfig);
    allRawItems.push(...items);
    await delay(1000);
  }

  console.log(`\n📊 Total relevant items: ${allRawItems.length}`);

  if (allRawItems.length === 0) {
    console.log('⚠️  No items found, skipping file write');
    return;
  }

  // Sort by pubDate descending, take top 20
  allRawItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  const topItems = allRawItems.slice(0, 20);

  console.log('\n' + '='.repeat(60));
  console.log('🤖 Translating and summarizing...');
  console.log('='.repeat(60));

  const processedItems = [];

  for (let i = 0; i < topItems.length; i++) {
    const item = topItems[i];
    console.log(`\n[${i + 1}/${topItems.length}] ${item.title.substring(0, 70)}`);
    console.log(`  Source: ${item.source} | Content: ${item.rawContent.length} chars`);

    const titleZh = await translateTitle(item.title);
    await delay(400);

    const summaryZh = item.rawContent.length > 50
      ? await summarizeContent(item.title, item.rawContent, item.sourceType)
      : null;
    await delay(400);

    processedItems.push({
      title: item.title,
      titleZh: titleZh || item.title,
      link: item.link,
      author: item.author,
      source: item.source,
      sourceType: item.sourceType,
      pubDate: item.pubDate,
      summaryZh: summaryZh || item.rawContent.substring(0, 200),
      category: item.category,
    });
  }

  const newData = {
    lastUpdated: new Date().toISOString(),
    items: processedItems,
  };

  const dataDir = path.join(__dirname, '../data');
  const publicDataDir = path.join(__dirname, '../public/data');

  fs.writeFileSync(path.join(dataDir, 'community-news.json'), JSON.stringify(newData, null, 2), 'utf-8');
  fs.writeFileSync(path.join(publicDataDir, 'community-news.json'), JSON.stringify(newData, null, 2), 'utf-8');

  console.log(`\n✅ Saved ${processedItems.length} items to community-news.json`);
  console.log('🌐 Community fetch complete!\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
