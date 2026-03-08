import React, { useEffect, useState } from 'react';
import { sendOutboundClickEvent } from '../../lib/ga';

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
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">おかいもの</h2>
          <a
            href="https://shop.oyakonojikanlabo.jp/collections/all?sort_by=created-descending"
            className="text-primary font-medium flex items-center"
            onClick={() => sendOutboundClickEvent({ url: 'https://shop.oyakonojikanlabo.jp/collections/all?sort_by=created-descending', link_text: '商品一覧へ' })}
          >
            商品一覧へ
            <div className="w-5 h-5 flex items-center justify-center ml-1">
              <i className="ri-arrow-right-line"></i>
            </div>
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col"
            >
              <a href={product.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-64 object-cover object-center"
                />
              </a>
              <div className="p-4 flex flex-col flex-grow">
                <a href={product.url} target="_blank" rel="noopener noreferrer">
                  <h3 className="text-lg font-bold mb-2 hover:underline">{product.title}</h3>
                </a>
                <div className="mt-auto">
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-block text-center bg-primary text-white py-2 font-medium rounded-button"
                    onClick={() => sendOutboundClickEvent({ url: product.url, link_text: product.title })}
                  >
                    商品ページへ
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShoppingSection;
