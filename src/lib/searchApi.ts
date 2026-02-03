import { request, gql } from 'graphql-request';

const endpoint = 'https://cms.oyakonojikanlabo.jp/graphql';

// 記事検索用のGraphQLクエリ
const SEARCH_POSTS = gql`
  query SearchPosts($search: String!, $first: Int!) {
    posts(where: { search: $search }, first: $first) {
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
        categories {
          nodes {
            name
          }
        }
      }
    }
  }
`;

// イベント検索用のGraphQLクエリ（カスタム投稿タイプ events）
const SEARCH_EVENTS = gql`
  query SearchEvents($search: String!, $first: Int!) {
    events(where: { search: $search, orderby: { field: DATE, order: DESC } }, first: $first) {
      nodes {
        id
        slug
        title
        date
        eventCpt {
          summary
          eventType
          mainImage {
            node {
              sourceUrl
            }
          }
          venueRef {
            nodes {
              __typename
              ... on NodeWithTitle {
                title
              }
            }
          }
        }
        eventCategories {
          nodes {
            name
            slug
          }
        }
        eventRegions {
          nodes {
            name
          }
        }
      }
    }
  }
`;

export interface SearchResult {
  id: string;
  type: 'article' | 'event' | 'school';
  title: string;
  excerpt: string;
  image: string;
  date?: string;
  category?: string;
  location?: string;
  url: string;
}

interface PostNode {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  slug: string;
  featuredImage?: {
    node?: {
      sourceUrl?: string | null;
    } | null;
  } | null;
  categories: {
    nodes: Array<{ name: string }>;
  };
}

interface PostsResponse {
  posts: {
    nodes: PostNode[];
  };
}

interface EventNode {
  id: string;
  slug: string;
  title?: string | null;
  date?: string | null;
  eventCpt?: {
    summary?: string | null;
    eventType?: string | null;
    mainImage?: {
      node?: {
        sourceUrl?: string | null;
      } | null;
    } | null;
    venueRef?: {
      nodes?: Array<{ title?: string | null } | null> | null;
    } | null;
  } | null;
  eventCategories?: {
    nodes?: Array<{ name?: string | null; slug?: string | null } | null> | null;
  } | null;
  eventRegions?: {
    nodes?: Array<{ name?: string | null } | null> | null;
  } | null;
}

interface EventsResponse {
  events: {
    nodes: EventNode[];
  };
}

export const searchApi = {
  // 記事を検索
  async searchArticles(query: string, limit: number = 10): Promise<SearchResult[]> {
    try {
      const data = await request<PostsResponse>(endpoint, SEARCH_POSTS, { 
        search: query, 
        first: limit 
      });
      
      return data.posts.nodes.map((post) => ({
        id: post.id,
        type: 'article' as const,
        title: post.title,
        excerpt: post.excerpt.replace(/<[^>]+>/g, ''), // HTMLタグ除去
        image: post.featuredImage?.node?.sourceUrl ?? '/default.jpg',
        date: new Date(post.date).toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        category: post.categories.nodes[0]?.name,
        url: `/${post.slug}`
      }));
    } catch (error) {
      console.error('記事検索エラー:', error);
      return [];
    }
  },

  // イベント（カスタム投稿タイプ events）を検索
  async searchEvents(query: string, limit: number = 10): Promise<SearchResult[]> {
    try {
      const data = await request<EventsResponse>(endpoint, SEARCH_EVENTS, {
        search: query,
        first: limit,
      });

      return data.events.nodes.map((event) => ({
        id: event.id,
        type: 'event' as const,
        title: event.title ?? '(無題イベント)',
        excerpt: (event.eventCpt?.summary ?? '').replace(/<[^>]+>/g, ''),
        image: event.eventCpt?.mainImage?.node?.sourceUrl ?? '/default.jpg',
        date: event.date
          ? new Date(event.date).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : undefined,
        category:
          event.eventCategories?.nodes?.find((cat) => cat?.name)?.name ??
          event.eventCpt?.eventType ??
          'イベント',
        location:
          event.eventRegions?.nodes?.find((node) => node?.name)?.name ??
          event.eventCpt?.venueRef?.nodes?.find((node) =>
            node && 'title' in node && node.title
          )?.title ??
          undefined,
        url: `/event/${event.slug}`,
      }));
    } catch (error) {
      console.error('イベント検索エラー:', error);
      return [];
    }
  },

  // スクール（events CPT 内で eventType=school のもの）を検索
  async searchSchools(query: string, limit: number = 10): Promise<SearchResult[]> {
    try {
      const data = await request<EventsResponse>(endpoint, SEARCH_EVENTS, {
        search: query,
        first: limit,
      });

      return data.events.nodes
        .filter((event) => (event.eventCpt?.eventType ?? '').toLowerCase() === 'school')
        .map((event) => ({
          id: event.id,
          type: 'school' as const,
          title: event.title ?? '(無題スクール)',
          excerpt: (event.eventCpt?.summary ?? '').replace(/<[^>]+>/g, ''),
          image: event.eventCpt?.mainImage?.node?.sourceUrl ?? '/default.jpg',
          category: event.eventCategories?.nodes?.find((cat) => cat?.name)?.name ?? 'スクール',
          location:
            event.eventRegions?.nodes?.find((node) => node?.name)?.name ??
            event.eventCpt?.venueRef?.nodes?.find((node) =>
              node && 'title' in node && node.title
            )?.title ??
            undefined,
          url: `/event/${event.slug}`,
        }));
    } catch (error) {
      console.error('スクール検索エラー:', error);
      return [];
    }
  },

  // 統合検索
  async searchAll(query: string, limit: number = 30): Promise<SearchResult[]> {
    try {
      const [articles, events, schools] = await Promise.all([
        this.searchArticles(query, Math.ceil(limit / 3)),
        this.searchEvents(query, Math.ceil(limit / 3)),
        this.searchSchools(query, Math.ceil(limit / 3))
      ]);

      return [...articles, ...events, ...schools];
    } catch (error) {
      console.error('統合検索エラー:', error);
      return [];
    }
  }
}; 
