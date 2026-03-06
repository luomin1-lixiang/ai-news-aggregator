require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { YoutubeTranscript } = require('youtube-transcript');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// Search queries: 3 topic groups, 10 videos total
const SEARCH_QUERIES = [
  { query: 'Claude Code AI coding assistant', category: 'claude-code', label: 'Claude Code', maxResults: 4 },
  { query: 'ChatGPT new features update', category: 'chatgpt', label: 'ChatGPT', maxResults: 3 },
  { query: 'AI inference chip NPU GPU accelerator benchmark', category: 'inference-chip', label: 'AI推理芯片', maxResults: 3 },
];

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Search YouTube videos published within the last 7 days
async function searchVideos(query, maxResults, publishedAfter) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=date&maxResults=${maxResults}&publishedAfter=${encodeURIComponent(publishedAfter)}&relevanceLanguage=en&key=${YOUTUBE_API_KEY}`;

  console.log(`  🔍 API request: ${query}`);
  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`YouTube API error (${response.status}): ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`YouTube API error: ${JSON.stringify(data.error)}`);
  }

  return data.items || [];
}

// Fetch transcript from YouTube (auto-generated or manual captions)
async function fetchTranscript(videoId) {
  try {
    const items = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
    const text = items.map(item => item.text).join(' ').replace(/\s+/g, ' ').trim();
    return text.length > 100 ? text : null;
  } catch (error) {
    console.log(`  ⚠️  No transcript for ${videoId}: ${error.message}`);
    return null;
  }
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
            { role: 'system', content: 'Translate the following YouTube video title into Chinese. Return only the translation, no extra text.' },
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
      const translated = data.choices?.[0]?.message?.content?.trim();
      return translated || title;
    } catch (error) {
      if (attempt < retries - 1) { await delay(Math.pow(2, attempt) * 1000); continue; }
      return title;
    }
  }
  return title;
}

// Summarize transcript into a Chinese article via DeepSeek
async function summarizeContent(title, content, retries = 3) {
  if (!DEEPSEEK_API_KEY) return null;

  const isShort = content.length < 500;

  const systemPrompt = isShort
    ? 'Translate the following content into fluent Chinese, preserving all original information.'
    : 'You are a professional tech journalist. Based on the video transcript, write a structured Chinese article (600-1000 characters) covering: core topic, key points, technical details, and significance. Write clearly and professionally without referencing "the video" directly.';

  const userContent = isShort
    ? content
    : `Video title: ${title}\n\nTranscript:\n${content.substring(0, 8000)}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log(`  📡 [DeepSeek] Attempt ${attempt + 1}: summarizing "${title.substring(0, 50)}..."`);

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
          max_tokens: 2000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`  ❌ [DeepSeek] Error (${response.status}): ${errorText.substring(0, 200)}`);
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

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🎬 YouTube video fetch started');
  console.log('='.repeat(60));

  if (!YOUTUBE_API_KEY) {
    console.error('❌ YOUTUBE_API_KEY not configured, skipping YouTube fetch');
    process.exit(0);
  }

  // Last 7 days
  const publishedAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  console.log(`📅 Searching videos published after: ${publishedAfter}`);

  const allVideos = [];

  for (const searchConfig of SEARCH_QUERIES) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`🔍 Query: "${searchConfig.query}" (max ${searchConfig.maxResults})`);

    try {
      const videos = await searchVideos(searchConfig.query, searchConfig.maxResults, publishedAfter);
      console.log(`  Found ${videos.length} videos`);

      for (const video of videos) {
        const videoId = video.id?.videoId;
        if (!videoId) continue;

        const snippet = video.snippet;
        console.log(`\n  📹 [${allVideos.length + 1}] ${snippet.title.substring(0, 70)}`);
        console.log(`       Channel: ${snippet.channelTitle}`);

        // Fetch transcript
        let transcript = await fetchTranscript(videoId);
        let contentSource = 'transcript';

        if (!transcript) {
          transcript = snippet.description || '';
          contentSource = 'description';
          console.log(`  ℹ️  Fallback to description (${transcript.length} chars)`);
        } else {
          console.log(`  ✅ Transcript (${transcript.length} chars)`);
        }

        await delay(300);

        // Translate title
        const titleZh = await translateTitle(snippet.title);
        await delay(500);

        // Summarize
        const summaryZh = transcript.length > 100
          ? await summarizeContent(snippet.title, transcript)
          : null;
        await delay(500);

        allVideos.push({
          videoId,
          title: snippet.title,
          titleZh: titleZh || snippet.title,
          channelName: typeof snippet.channelTitle === 'string' ? snippet.channelTitle : 'Unknown',
          publishedAt: snippet.publishedAt,
          thumbnailUrl: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          summaryZh: summaryZh || transcript.substring(0, 300),
          contentSource,
          category: searchConfig.category,
          categoryLabel: searchConfig.label,
        });
      }

      await delay(1000);
    } catch (error) {
      console.error(`❌ Search failed for "${searchConfig.query}": ${error.message}`);
    }
  }

  // Sort by publishedAt descending
  allVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Total videos processed: ${allVideos.length}`);

  if (allVideos.length === 0) {
    console.log('⚠️  No videos found, skipping file write');
    return;
  }

  const newData = {
    lastUpdated: new Date().toISOString(),
    items: allVideos,
  };

  const dataDir = path.join(__dirname, '../data');
  const publicDataDir = path.join(__dirname, '../public/data');

  fs.writeFileSync(path.join(dataDir, 'youtube-news.json'), JSON.stringify(newData, null, 2), 'utf-8');
  fs.writeFileSync(path.join(publicDataDir, 'youtube-news.json'), JSON.stringify(newData, null, 2), 'utf-8');

  console.log('💾 Saved to data/youtube-news.json and public/data/youtube-news.json');
  console.log('🎬 YouTube fetch complete!\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
