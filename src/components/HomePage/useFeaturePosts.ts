import { ApolloClient, HttpLink, InMemoryCache, gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import React from 'react';

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
                  content
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

  return { featurePosts, loading, error };
};
