import { useEffect, useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [newsData, setNewsData] = useState({ items: [], lastUpdated: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 加载新闻数据
    fetch('/data/news.json')
      .then(res => res.json())
      .then(data => {
        setNewsData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('加载数据失败:', error);
        setLoading(false);
      });
  }, []);

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

  return (
    <div className={styles.container}>
      <Head>
        <title>AI新闻聚合 - 每日AI热点</title>
        <meta name="description" content="每天8:00自动更新的AI领域热门新闻和资讯" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>🤖 AI新闻聚合</h1>
          <p className={styles.subtitle}>每日精选人工智能领域热门资讯</p>
          {newsData.lastUpdated && (
            <p className={styles.updateTime}>
              最后更新: {new Date(newsData.lastUpdated).toLocaleString('zh-CN')}
            </p>
          )}
        </header>

        {loading ? (
          <div className={styles.loading}>加载中...</div>
        ) : newsData.items.length === 0 ? (
          <div className={styles.empty}>暂无新闻数据</div>
        ) : (
          <div className={styles.newsList}>
            {newsData.items.map((item, index) => (
              <article key={index} className={styles.newsItem}>
                <div className={styles.newsHeader}>
                  <span className={styles.sourceIcon}>
                    {getSourceIcon(item.sourceType)}
                  </span>
                  <span className={styles.source}>{item.source}</span>
                  <span className={styles.separator}>•</span>
                  <span className={styles.author}>{item.author}</span>
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

                <p className={styles.newsDescription}>{item.descriptionZh || item.description}</p>

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
          数据来源: YouTube, TechCrunch, The Verge, 机器之心, 36氪 等
        </p>
        <p>每天早上 8:00 自动更新 | 保留最近30天内容</p>
      </footer>
    </div>
  );
}
