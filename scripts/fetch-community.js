require('dotenv').config();
const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// Reddit: 7-day window via both /new and /top?t=week
// GitHub Releases: 3-day window, capped at 3 items
const COMMUNITY_FEEDS = [
  {
    url: 'https://www.reddit.com/r/ClaudeAI/new.rss',
    name: 'r/ClaudeAI',
    sourceType: 'reddit',
    category: 'reddit',
    filterKeywords: true,
    lookbackHours: 168,
  },
  {
    url: 'https://www.reddit.com/r/ClaudeAI/top.rss?t=week',
    name: 'r/ClaudeAI',
    sourceType: 'reddit',
    category: 'reddit',
    filterKeywords: true,
    lookbackHours: 168,
  },
  {
    url: 'https://www.reddit.com/r/AnthropicAI/new.rss',
    name: 'r/AnthropicAI',
    sourceType: 'reddit',
    category: 'reddit',
    filterKeywords: true,
    lookbackHours: 168,
  },
  {
    url: 'https://www.reddit.com/r/AnthropicAI/top.rss?t=week',
    name: 'r/AnthropicAI',
    sourceType: 'reddit',
    category: 'reddit',
    filterKeywords: true,
    lookbackHours: 168,
  },
  {
    url: 'https://github.com/anthropics/claude-code/releases.atom',
    name: 'Claude Code Releases',
    sourceType: 'github-release',
    category: 'github-release',
    filterKeywords: false,
    lookbackHours: 72,
  },
];

// Keywords to filter Reddit posts - covers both product topics and user-experience language
const CLAUDE_CODE_KEYWORDS = [
  // Product / tool names
  'claude code', 'claude-code', 'claude code cli',
  'mcp', 'mcp server', 'computer use',
  // Config / integrations
  'hooks', '.claude', 'claude_desktop', 'claude desktop',
  // API
  'claude api', 'anthropic api',
  // Models
  'claude 3', 'claude 4', 'sonnet', 'haiku', 'opus',
  // User-experience language
  'workflow', 'use case', 'productivity', 'automation',
  'tips', 'tricks', 'tutorial', 'guide', 'how i',
  'my setup', 'my workflow', 'built with', 'built using',
  'slash command', 'custom command', 'memory', 'project',
  'prompt', 'context', 'codebase', 'repository',
  // News signals
  'new feature', 'update', 'release', 'version',
  'bug', 'fix',
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

// Score Reddit items: longer content = more in-depth discussion; penalize age slightly
function scoreRedditItem(item) {
  const contentLen = item.rawContent.length;
  const ageHours = (Date.now() - new Date(item.pubDate).getTime()) / (1000 * 60 * 60);
  return contentLen - ageHours * 20;
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

  let systemPrompt;
  if (sourceType === 'github-release') {
    systemPrompt = 'You are a tech journalist. Summarize the following Claude Code release notes into a clear Chinese summary (300-500 characters). Highlight: new features, bug fixes, breaking changes. Keep version numbers and technical terms in English.';
  } else {
    // Reddit: extract practical user insights
    systemPrompt = `You are a tech content curator for Chinese developers. Analyze this Reddit post about Claude Code / AI tools and write a Chinese summary (400-600 characters) that covers:
1. 用户场景：what the user was trying to accomplish
2. 核心方法：the specific workflow, approach, or solution described
3. 关键技巧：actionable tips, key insights, or pitfalls mentioned
Focus on practical value for developers. If the post is a question thread, summarize the best answers. Keep technical terms (Claude Code, MCP, API, hooks, etc.) in English.`;
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
  console.log(`📡 Fetching: ${feedConfig.name} (${feedConfig.url.includes('top') ? 'top/week' : 'new'})`);

  try {
    const feed = await parser.parseURL(feedConfig.url);
    console.log(`  Found ${feed.items.length} items`);

    const cutoff = new Date(Date.now() - feedConfig.lookbackHours * 60 * 60 * 1000);
    const items = [];

    for (const item of feed.items) {
      const pubDate = new Date(item.pubDate || item.isoDate || item.updated);

      if (pubDate < cutoff) continue;

      const rawContent = stripHtml(item.contentEncoded || item.content || item.summary || item.description || '');
      const title = item.title || '';

      // Discard stub Reddit posts with no meaningful content
      if (feedConfig.sourceType === 'reddit' && rawContent.length < 100) continue;

      // Filter Reddit posts by keyword relevance
      if (feedConfig.filterKeywords && !isClaudeCodeRelated(title, rawContent)) continue;

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

  // Deduplicate by link (top and new feeds may overlap)
  const seen = new Set();
  const dedupedItems = allRawItems.filter(item => {
    if (seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
  });

  console.log(`\n📊 After dedup: ${dedupedItems.length} unique items`);

  // Separate by source type and apply per-type caps
  const redditItems = dedupedItems
    .filter(item => item.sourceType === 'reddit')
    .sort((a, b) => scoreRedditItem(b) - scoreRedditItem(a))
    .slice(0, 15);

  const githubItems = dedupedItems
    .filter(item => item.sourceType === 'github-release')
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .slice(0, 3);

  console.log(`  Reddit: ${redditItems.length} items (by content richness)`);
  console.log(`  GitHub Releases: ${githubItems.length} items (most recent)`);

  // GitHub releases last so Reddit content appears first
  const topItems = [...redditItems, ...githubItems];

  if (topItems.length === 0) {
    console.log('⚠️  No items found, skipping file write');
    return;
  }

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
