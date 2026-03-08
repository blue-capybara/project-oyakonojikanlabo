import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { request, gql } from 'graphql-request';

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  tags: string[];
}

interface ArticleNode {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  featuredImage?: {
    node?: {
      sourceUrl?: string | null;
    } | null;
  } | null;
  tags: {
    nodes: Array<{ name: string }>;
  };
}

interface ArticlesResponse {
  posts: {
    nodes: ArticleNode[];
  };
}

const truncateExcerptByHalf = (text: string): string => {
  if (!text) {
    return '';
  }
  const halfLength = Math.max(1, Math.floor(text.length / 2));
  return text.length > halfLength ? `${text.slice(0, halfLength)}…` : text;
};

const endpoint = 'https://cms.oyakonojikanlabo.jp/graphql';

const GET_ARTICLES = gql`
  query GetArticles {
    posts(first: 6) {
      nodes {
        id
        title
        excerpt
        date
        slug
        featuredImage {
          node {
            sourceUrl
          }
        }
        tags {
          nodes {
            name
          }
        }
      }
    }
  }
`;

const ArticlesSection: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const data = await request<ArticlesResponse>(endpoint, GET_ARTICLES);
        const nodes = data.posts.nodes;

        const formatted: Article[] = nodes.map((post) => {
          const cleanedExcerpt = post.excerpt
            .replace(/<[^>]+>/g, '') // HTMLタグ除去
            .replace(/\[&hellip;\]/g, '...')
            .trim();

          return {
            id: post.id,
            slug: post.slug,
            title: post.title,
            excerpt: truncateExcerptByHalf(cleanedExcerpt),
            date: new Date(post.date).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            image: post.featuredImage?.node?.sourceUrl ?? '/default.jpg',
            tags: post.tags.nodes.map((tag) => tag.name),
          };
        });

        setArticles(formatted);
      } catch (error) {
        console.error('記事の取得に失敗しました:', error);
      }
    };

    fetchArticles();
  }, []);

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">記事一覧</h2>
          <Link to="/archive" className="text-primary font-medium flex items-center">
            すべて見る
            <div className="w-5 h-5 flex items-center justify-center ml-1">
              <i className="ri-arrow-right-line"></i>
            </div>
          </Link>
        </div>
        <div className="grid grid-cols-1 min-[600px]:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <Link
              to={`/${article.slug}`}
              key={article.id}
              className="block hover:cursor-pointer group"
            >
              <div className="flex flex-col h-full bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 group-hover:-translate-y-1">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-48 object-cover object-top"
                />
                <div className="flex flex-col justify-between flex-1 p-6">
                  <div>
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-nowrap -mx-1 px-1 py-1 mb-3 min-h-[32px]">
                      {article.tags.map((tag) => (
                        <span
                          key={`${article.id}-${tag}`}
                          className="shrink-0 inline-flex items-center bg-gray-100 text-gray-800 px-3 py-1 text-xs rounded-full whitespace-nowrap leading-none"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-xl font-bold mb-2 line-clamp-2 lg:line-clamp-none">
                      {article.title}
                    </h3>
                    <p className="hidden lg:block text-gray-600 mb-4">{article.excerpt}</p>
                  </div>
                  <span className="text-gray-500 text-sm mt-auto">{article.date}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ArticlesSection;
