import { ApolloClient, HttpLink, InMemoryCache, gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import React from 'react';
import { fetchStaticPostCache } from '../../lib/postCache';

export const featureClient = new ApolloClient({
  link: new HttpLink({ uri: 'https://cms.oyakonojikanlabo.jp/graphql' }),
  cache: new InMemoryCache(),
});

export const GET_FEATURES = gql`
  query GetFeatures {
    features {
      nodes {
        id
        ... on Feature {
          featureSettings {
            relatedPost {
              nodes {
                id
                ... on Post {
                  slug
                  title
                  date
                  excerpt
                  featuredImage {
                    node {
                      sourceUrl
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const GET_FEATURE_CONTENT = gql`
  query GetFeatureContent($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      content
    }
  }
`;

export type RelatedPost = {
  id: string;
  slug: string;
  title: string;
  date: string;
  content?: string | null;
  excerpt?: string | null;
  featuredImage?: {
    node?: {
      sourceUrl?: string | null;
    } | null;
  } | null;
};

export type FeaturePostEntry = {
  featureId: string;
  post: RelatedPost;
};

type FeatureNode = {
  id: string;
  featureSettings?: {
    relatedPost?: {
      nodes: RelatedPost[];
    } | null;
  } | null;
};

type FeaturesResponse = {
  features: {
    nodes: FeatureNode[];
  };
};

export const useFeaturePosts = (options?: { skip?: boolean }) => {
  const { data, loading, error } = useQuery<FeaturesResponse>(GET_FEATURES, {
    skip: options?.skip,
  });
  const [contents, setContents] = React.useState<Record<string, string>>({});

  const featurePosts = React.useMemo(() => {
    const nodes = data?.features?.nodes ?? [];
    return nodes
      .map((feature) => {
        const related = feature.featureSettings?.relatedPost?.nodes ?? [];
        if (!related.length) return null;
        return {
          featureId: feature.id,
          post: related[0],
        };
      })
      .filter(Boolean) as FeaturePostEntry[];
  }, [data]);

  React.useEffect(() => {
    if (options?.skip) return;
    const controller = new AbortController();
    // 抜粋が空の記事だけ本文を補い、特集一覧の表示は待たせません。
    featurePosts
      .filter(({ post }) => !post.excerpt?.trim())
      .forEach(({ post }) => {
        (async () => {
          const cached = await fetchStaticPostCache<RelatedPost>(post.slug, controller.signal);
          if (controller.signal.aborted) return;
          if (cached?.content) return cached.content;
          const response = await featureClient.query<{ post: { content: string } | null }>({
            query: GET_FEATURE_CONTENT,
            variables: { slug: post.slug },
            context: { fetchOptions: { signal: controller.signal } },
          });
          return response.data?.post?.content;
        })()
          .then((content) => {
            if (content && !controller.signal.aborted)
              setContents((previous) => ({ ...previous, [post.slug]: content }));
          })
          .catch(() => {
            // 紹介文の補完に失敗しても、取得済みの特集とリンクは表示します。
          });
      });
    return () => controller.abort();
  }, [featurePosts, options?.skip]);

  const postsWithContent = React.useMemo(
    () =>
      featurePosts.map((entry) => ({
        ...entry,
        post: { ...entry.post, content: contents[entry.post.slug] },
      })),
    [featurePosts, contents],
  );

  return { featurePosts: postsWithContent, loading, error };
};
