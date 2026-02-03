import React from 'react';

type PostContentProps = {
  title: string;
  content: string;
  status?: string;
};

/**
 * WordPress プレビュー／通常記事の本文をシンプルに描画するコンポーネント。
 * dangerouslySetInnerHTML でそのまま表示し、記事画面でも再利用可能にしています。
 */
const PostContent: React.FC<PostContentProps> = ({ title, content, status }) => {
  const isDraft = status && status !== 'publish';

  return (
    <article className="max-w-4xl mx-auto">
      <header className="mb-8">
        <p className="text-sm text-gray-500">現在表示しているのはプレビュー用の記事です。</p>
        <div className="flex items-center gap-3 mt-2">
          {isDraft && (
            <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-semibold">
              {status === 'draft' ? '下書き' : status}
            </span>
          )}
          <h1 className="text-3xl font-bold leading-tight text-gray-900">{title}</h1>
        </div>
      </header>

      <div
        className="prose prose-lg max-w-none leading-relaxed text-gray-800"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </article>
  );
};

export default PostContent;
