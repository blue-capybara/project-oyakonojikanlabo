import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout/Layout';

const NotFoundPage: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-gray-300">404</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">ページが見つかりません</h2>
            <p className="text-gray-600 mb-8">
              お探しのページは存在しないか、移動された可能性があります。
            </p>
          </div>
          
          <div className="space-y-4">
            <Link
              to="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              ホームに戻る
            </Link>
            
            <div className="text-sm text-gray-500">
              <Link to="/archive" className="text-blue-600 hover:underline mr-4">
                特集一覧
              </Link>
              <Link to="/event" className="text-blue-600 hover:underline mr-4">
                イベント一覧
              </Link>
              <Link to="/culture-school" className="text-blue-600 hover:underline">
                文化教室
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFoundPage;
