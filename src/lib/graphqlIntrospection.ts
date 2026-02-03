import { request, gql } from 'graphql-request';

const endpoint = 'https://cms.oyakonojikanlabo.jp/graphql';

interface IntrospectionTypeRef {
  name: string | null;
  kind: string;
  ofType?: IntrospectionTypeRef | null;
}

interface IntrospectionField {
  name: string;
  type: IntrospectionTypeRef;
}

interface IntrospectionSchema {
  __schema: {
    queryType: {
      name: string;
      fields: IntrospectionField[];
    };
    types: Array<{
      name: string;
      kind: string;
      fields?: IntrospectionField[] | null;
    }>;
  };
}

// GraphQLスキーマのイントロスペクション
const INTROSPECTION_QUERY = gql`
  query IntrospectionQuery {
    __schema {
      queryType {
        name
        fields {
          name
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
      types {
        name
        kind
        fields {
          name
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
    }
  }
`;

export const graphqlIntrospection = {
  async getSchema(): Promise<IntrospectionSchema | null> {
    try {
      const data = await request<IntrospectionSchema>(endpoint, INTROSPECTION_QUERY);
      return data;
    } catch (error) {
      console.error('GraphQLスキーマ取得エラー:', error);
      return null;
    }
  },

  async getAvailableTypes(): Promise<string[]> {
    try {
      const data = await request<IntrospectionSchema>(endpoint, INTROSPECTION_QUERY);
      const queryFields = data.__schema.queryType.fields.map((field) => field.name);
      console.log('利用可能なクエリフィールド:', queryFields);
      return queryFields;
    } catch (error) {
      console.error('GraphQLタイプ取得エラー:', error);
      return [];
    }
  }
}; 
