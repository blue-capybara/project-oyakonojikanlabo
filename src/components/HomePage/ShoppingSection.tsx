import React, { useEffect, useState } from 'react';
import { sendOutboundClickEvent } from '../../lib/ga';
import ExternalLink from '../ExternalLink';

interface Product {
  id: string;
  title: string;
  image: string;
  url: string;
}

interface ShopifyProductNode {
  id: string;
  title: string;
  handle: string;
  images: {
    edges: Array<{
      node: {
        originalSrc: string;
        altText?: string | null;
      };
    }>;
  };
}

interface ShopifyProductResponse {
  data: {
    products: {
      edges: Array<{
        node: ShopifyProductNode;
      }>;
    };
  };
}

const ShoppingSection: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          'https://ehonyasan-moe.oyakonojikanlabo.jp/socks/shopify-proxy.php',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: `{
              products(first: 4, sortKey: CREATED_AT, reverse: true) {
                edges {
                  node {
                    id
                    title
                    handle
                    images(first: 1) {
                      edges {
                        node {
                          originalSrc
                          altText
                        }
                      }
                    }
                  }
                }
              }
            }`,
            }),
          },
        );

        const json: ShopifyProductResponse = await response.json();
        const edges = json.data?.products?.edges ?? [];

        const formatted = edges.map(({ node }) => {
          const image = node.images.edges[0]?.node;
          return {
            id: node.id,
            title: node.title,
            image: image?.originalSrc ?? '',
            url: `https://shop.oyakonojikanlabo.jp/products/${node.handle}`,
          };
        });

        setProducts(formatted);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">おかいもの</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col"
            >
              <ExternalLink href={product.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={product.image}
                  alt={product.title}
                  className="aspect-square w-full object-cover object-center sm:aspect-auto sm:h-64"
                />
              </ExternalLink>
              <div className="flex flex-grow flex-col p-3 sm:p-4">
                <ExternalLink href={product.url} target="_blank" rel="noopener noreferrer">
                  <h3 className="mb-2 line-clamp-2 text-sm font-bold hover:underline sm:text-lg">
                    {product.title}
                  </h3>
                </ExternalLink>
                <div className="mt-auto">
                  <ExternalLink
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-button bg-primary px-2 py-2 text-center text-sm font-medium text-white sm:text-base"
                    onClick={() =>
                      sendOutboundClickEvent({ url: product.url, link_text: product.title })
                    }
                  >
                    商品ページへ
                  </ExternalLink>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <ExternalLink
            href="https://shop.oyakonojikanlabo.jp/collections/all?sort_by=created-descending"
            className="inline-flex items-center text-primary hover:text-primary/80"
            onClick={() =>
              sendOutboundClickEvent({
                url: 'https://shop.oyakonojikanlabo.jp/collections/all?sort_by=created-descending',
                link_text: '商品一覧へ',
              })
            }
          >
            商品一覧へ
            <i className="ri-arrow-right-line ml-2" aria-hidden="true"></i>
          </ExternalLink>
        </div>
      </div>
    </section>
  );
};

export default ShoppingSection;
