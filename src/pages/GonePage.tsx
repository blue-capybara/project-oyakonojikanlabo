import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout/Layout';

interface GonePageProps {
  title?: string;
  message?: string;
  backTo?: string;
  backLabel?: string;
}

const GonePage: React.FC<GonePageProps> = ({
  title = 'このページは公開を終了しました',
  message = 'お探しのコンテンツは削除または公開終了となり、現在はご利用いただけません。',
  backTo = '/',
  backLabel = 'ホームに戻る',
}) => {
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-gray-300 mb-4">410</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">{title}</h2>
            <p className="text-gray-600 mb-8">{message}</p>
          </div>

          <div className="space-y-4">
            <Link
              to={backTo}
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {backLabel}
            </Link>
            <div className="text-sm text-gray-500">
              <Link to="/" className="text-blue-600 hover:underline">
                ホームに戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GonePage;
