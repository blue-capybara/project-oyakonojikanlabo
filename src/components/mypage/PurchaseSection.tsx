// src/components/mypage/PurchaseSection.tsx
import React from 'react';

const PurchaseSection: React.FC = () => {
  return (
    <section id="purchases-section">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold mb-6 pb-2 border-b border-gray-200">購入履歴</h2>

        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  商品
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  注文日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  注文番号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  金額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[
                {
                  name: '絵本「もりのなかまたち」',
                  author: '作者：佐藤まさゆき',
                  date: '2025年6月15日',
                  number: 'P25061501',
                  price: '¥1,650',
                  status: '発送済み',
                  image:
                    'https://readdy.ai/api/search-image?query=children%2520book%2520with%2520cute%2520animal%2520characters%2C%2520Japanese%2520style%2520illustration%2C%2520soft%2520colors%2C%2520white%2520background&width=200&height=200&seq=7&orientation=squarish',
                },
                {
                  name: '絵本の靴下「おはなしの森」',
                  author: 'サイズ：22-24cm',
                  date: '2025年6月10日',
                  number: 'P25061001',
                  price: '¥1,320',
                  status: '発送済み',
                  image:
                    'https://readdy.ai/api/search-image?query=cute%2520colorful%2520socks%2520with%2520book%2520pattern%2C%2520Japanese%2520style%2C%2520product%2520photography%2C%2520white%2520background&width=200&height=200&seq=8&orientation=squarish',
                },
                {
                  name: '絵本「四季のおくりもの」',
                  author: '作者：高橋みのり',
                  date: '2025年6月5日',
                  number: 'P25060501',
                  price: '¥1,540',
                  status: '発送済み',
                  image:
                    'https://readdy.ai/api/search-image?query=children%2520book%2520about%2520seasons%2C%2520Japanese%2520style%2520illustration%2C%2520soft%2520colors%2C%2520white%2520background&width=200&height=200&seq=9&orientation=squarish',
                },
              ].map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover object-top"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.author}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.date}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.price}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-green-100 text-green-800">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-primary hover:text-primary/80">詳細</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-center">
          <button className="text-primary hover:text-primary/80 flex items-center">
            もっと見る
            <div className="w-5 h-5 flex items-center justify-center ml-1">
              <i className="ri-arrow-down-s-line"></i>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};

export default PurchaseSection;
