import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';

type OgType = 'website' | 'article';

export interface SeoProps {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: OgType;
  noindex?: boolean;
}

const stripHtml = (value?: string) => {
  if (!value) return undefined;
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * SEOメタタグをまとめて出力する共通コンポーネント。
 * - react-helmet-async と併用する想定（ルートに HelmetProvider が必要）。
 * - OGP / description / noindex をまとめて制御する。
 * - 将来的に canonical や構造化データを追加しやすい構成。
 */
const Seo: React.FC<SeoProps> = ({
  title,
  description,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = 'website',
  noindex,
}) => {
  const sanitizedDescription = useMemo(() => stripHtml(description), [description]);
  const computedTitle = title ? `${title}｜親子の時間研究所` : '親子の時間研究所';
  const computedOgTitle = ogTitle ?? title ?? '親子の時間研究所';
  const computedOgDescription = ogDescription ?? sanitizedDescription;
  const ogUrl = typeof window !== 'undefined' ? window.location.href : undefined;

  return (
    <Helmet>
      <title>{computedTitle}</title>
      {sanitizedDescription && <meta name="description" content={sanitizedDescription} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={computedOgTitle} />
      {computedOgDescription && <meta property="og:description" content={computedOgDescription} />}
      {ogUrl && <meta property="og:url" content={ogUrl} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
    </Helmet>
  );
};

export default Seo;

/**
 * 使い方メモ：
 * 1) ルート（例: App.tsx）で <HelmetProvider> でアプリをラップしてください。
 * 2) ページコンポーネントで <Seo /> を呼び出します。
 *
 * ▼記事詳細ページ例
 * <Seo
 *   title="投稿タイトル"
 *   description="投稿の抜粋"
 *   ogType="article"
 * />
 *
 * ▼一覧ページ例
 * <Seo
 *   title="記事一覧"
 *   description="一覧ページ用固定文言"
 * />
 */
