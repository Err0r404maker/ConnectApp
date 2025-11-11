import { marked } from 'marked';
import { useMemo } from 'react';
import DOMPurify from 'isomorphic-dompurify';

marked.setOptions({
  breaks: true,
  gfm: true
});

export const MarkdownMessage = ({ content }: { content: string }) => {
  const html = useMemo(() => {
    const raw = marked(content, { async: false }) as string;
    return DOMPurify.sanitize(raw);
  }, [content]);

  return (
    <div 
      className="prose prose-sm dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
