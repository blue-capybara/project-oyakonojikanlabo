import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import ContactForm from '../components/ContactForm/ContactForm';

const ContactPage: React.FC = () => {
  return (
    <Layout showNewsletter={false}>
      <main className="pt-36 pb-20">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <Link to="/" className="flex items-center text-gray-600 hover:text-primary transition-colors">
                <div className="w-5 h-5 flex items-center justify-center mr-1">
                  <i className="ri-arrow-left-line"></i>
                </div>
                <span>戻る</span>
              </Link>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">総合お問い合わせ窓口</h1>
            <p className="text-gray-600 text-center max-w-3xl mx-auto">
              絵本アート系イベントの掲載、商品について、取材のご依頼など、様々なお問い合わせに対応しています。お気軽にご相談ください。画像の添付も可能です。
            </p>
          </div>

          <ContactForm />
        </div>
      </main>
    </Layout>
  );
};

export default ContactPage;
