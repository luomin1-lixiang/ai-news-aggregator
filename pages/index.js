import { useEffect, useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import ClientOnlyMarkdown from '../components/ClientOnlyMarkdown';

export default function Home() {
  const [activeTab, setActiveTab] = useState('ai-news'); // 'ai-news', 'anthropic', 'gemini'
  const [newsData, setNewsData] = useState({ items: [], lastUpdated: null });
  const [anthropicData, setAnthropicData] = useState({ items: [], lastUpdated: null });
  const [geminiData, setGeminiData] = useState({ items: [], lastUpdated: null });
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState({}); // 记录展开状态

  useEffect(() => {
    // 加载所有数据
    const basePath = process.env.NODE_ENV === 'production' ? '/ai-news-aggregator' : '';
    const timestamp = new Date().getTime();

    // 加载AI芯片新闻
    fetch(`${basePath}/data/news.json?t=${timestamp}`, { cache: 'no-cache' })
      .then(res => res.json())
      .then(data => setNewsData(data))
      .catch(error => {
        console.error('加载AI新闻失败:', error);
        setNewsData({ items: [], lastUpdated: null });
      });

    // 加载Anthropic博客
    fetch(`${basePath}/data/anthropic-news.json?t=${timestamp}`, { cache: 'no-cache' })
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => setAnthropicData(data))
      .catch(error => {
        console.error('加载Anthropic博客失败:', error);
        setAnthropicData({ items: [], lastUpdated: null });
      });

    // 加载Gemini博客
    fetch(`${basePath}/data/gemini-news.json?t=${timestamp}`, { cache: 'no-cache' })
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => setGeminiData(data))
      .catch(error => {
        console.error('加载Gemini博客失败:', error);
        setGeminiData({ items: [], lastUpdated: null });
      })
      .finally(() => setLoading(false));
  }, []);

  // 获取当前Tab的数据
  const getCurrentData = () => {
    switch (activeTab) {
      case 'ai-news':
        return newsData;
      case 'anthropic':
        return anthropicData;
      case 'gemini':
        return geminiData;
      default:
        return { items: [], lastUpdated: null };
    }
  };

  const currentData = getCurrentData();

  // 获取作者名称（处理author可能是对象的情况）
  const getAuthorName = (author) => {
    if (!author) return '';
    if (typeof author === 'string') return author;
    if (typeof author === 'object') {
      if (author.name) {
        return Array.isArray(author.name) ? author.name[0] : author.name;
      }
      return '';
    }
    return '';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes}分钟前`;
      }
      return `${diffHours}小时前`;
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const getSourceIcon = (sourceType) => {
    switch (sourceType) {
      case 'youtube':
        return '🎥';
      case 'twitter':
        return '🐦';
      case 'news':
        return '📰';
      default:
        return '📌';
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'cloud-inference':
        return { text: '云端推理', icon: '☁️', color: '#667eea' };
      case 'edge-inference':
        return { text: '边缘推理', icon: '📱', color: '#f59e0b' };
      case 'inference-optimization':
        return { text: '推理优化', icon: '⚡', color: '#10b981' };
      case 'architecture':
        return { text: '架构创新', icon: '🏗️', color: '#8b5cf6' };
      case 'inference-other':
        return { text: '其他推理', icon: '💡', color: '#ec4899' };
      // 兼容旧分类
      case 'ai-chip':
        return { text: 'AI芯片', icon: '💻', color: '#667eea' };
      case 'ai-hardware':
        return { text: 'AI硬件', icon: '🔧', color: '#f59e0b' };
      case 'ai-other':
        return { text: 'AI资讯', icon: '🤖', color: '#10b981' };
      default:
        return { text: 'AI', icon: '🤖', color: '#6b7280' };
    }
  };

  // 切换展开/收起状态
  const toggleExpand = (index) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // 检查内容是否足够长需要展开按钮（超过200个字符）
  const needsExpandButton = (item) => {
    const content = item.descriptionZh || item.description || '';
    return content.length > 200;
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>AI新闻聚合 - 每日AI热点</title>
        <meta name="description" content="每天8:00自动更新的AI领域热门新闻和资讯" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>🤖 AI技术资讯聚合</h1>
          <p className={styles.subtitle}>每日精选AI推理芯片、Anthropic、Gemini技术资讯</p>

          {/* Tab导航 */}
          <div className={styles.tabNav}>
            <button
              className={`${styles.tabButton} ${activeTab === 'ai-news' ? styles.tabButtonActive : ''}`}
              onClick={() => setActiveTab('ai-news')}
            >
              🔧 AI芯片新闻
              {newsData.items.length > 0 && <span className={styles.tabBadge}>{newsData.items.length}</span>}
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'anthropic' ? styles.tabButtonActive : ''}`}
              onClick={() => setActiveTab('anthropic')}
            >
              🧠 Anthropic博客
              {anthropicData.items.length > 0 && <span className={styles.tabBadge}>{anthropicData.items.length}</span>}
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'gemini' ? styles.tabButtonActive : ''}`}
              onClick={() => setActiveTab('gemini')}
            >
              💎 Gemini博客
              {geminiData.items.length > 0 && <span className={styles.tabBadge}>{geminiData.items.length}</span>}
            </button>
          </div>

          {currentData.lastUpdated && (
            <p className={styles.updateTime}>
              最后更新: {new Date(currentData.lastUpdated).toLocaleString('zh-CN')}
            </p>
          )}
        </header>

        {loading ? (
          <div className={styles.loading}>加载中...</div>
        ) : currentData.items.length === 0 ? (
          <div className={styles.empty}>暂无内容</div>
        ) : (
          <div className={styles.newsList}>
            {currentData.items.map((item, index) => (
              <article key={index} className={styles.newsItem}>
                <div className={styles.newsHeader}>
                  <span className={styles.sourceIcon}>
                    {getSourceIcon(item.sourceType)}
                  </span>
                  <span className={styles.source}>{item.source}</span>
                  <span className={styles.separator}>•</span>
                  <span className={styles.author}>{getAuthorName(item.author)}</span>
                  <span className={styles.separator}>•</span>
                  <span className={styles.date}>{formatDate(item.pubDate)}</span>
                  {item.category && (
                    <>
                      <span className={styles.separator}>•</span>
                      <span
                        className={styles.categoryTag}
                        style={{
                          backgroundColor: getCategoryLabel(item.category).color + '20',
                          color: getCategoryLabel(item.category).color,
                          borderColor: getCategoryLabel(item.category).color
                        }}
                      >
                        {getCategoryLabel(item.category).icon} {getCategoryLabel(item.category).text}
                      </span>
                    </>
                  )}
                </div>

                <h2 className={styles.newsTitle}>
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    {item.titleZh || item.title}
                  </a>
                </h2>

                {/* 显示新闻摘要（中文翻译优先），支持Markdown格式 */}
                <div className={`${styles.newsContent} ${expandedItems[index] ? styles.newsContentExpanded : styles.newsContentCollapsed}`}>
                  <ClientOnlyMarkdown>{item.descriptionZh || item.description}</ClientOnlyMarkdown>
                </div>
                {needsExpandButton(item) && (
                  <button
                    className={styles.expandButton}
                    onClick={() => toggleExpand(index)}
                  >
                    {expandedItems[index] ? '收起内容 ▲' : '展开全文 ▼'}
                  </button>
                )}

                <div className={styles.newsFooter}>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.readMore}
                  >
                    阅读原文 →
                  </a>
                  {item.popularity > 0 && (
                    <span className={styles.popularity}>
                      👁️ {item.popularity.toLocaleString()} 次观看
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>
          数据来源: Reuters, BBC, MIT, TechCrunch, The Verge, OpenAI, Google AI, 机器之心, 量子位 等37个源
        </p>
        <p>每天早上 8:00 自动更新 | AI芯片新闻显示48小时内 | 博客显示7天内</p>
      </footer>
    </div>
  );
}
