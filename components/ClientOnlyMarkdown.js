import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

// 纯客户端渲染的 Markdown 组件，避免 SSR 水合错误
export default function ClientOnlyMarkdown({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // 服务端渲染时返回 null，避免水合错误
    return null;
  }

  return <ReactMarkdown>{children}</ReactMarkdown>;
}
