import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import ContactForm from '../components/ContactForm/ContactForm';

const ContactPicoPage: React.FC = () => {
  return (
    <Layout showNewsletter={false}>
      <main className="pt-36 pb-20">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <Link
                to="/pico"
                className="flex items-center text-gray-600 hover:text-primary transition-colors"
              >
                <div className="w-5 h-5 flex items-center justify-center mr-1">
                  <i className="ri-arrow-left-line"></i>
                </div>
                <span>戻る</span>
              </Link>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
              PICOお問い合わせ窓口
            </h1>
            <p className="text-gray-600 text-center max-w-3xl mx-auto">
              PICO豊中に関するご相談・ご質問はこちらからご連絡ください。担当者が確認のうえご返信いたします。
            </p>
          </div>

          {/* PICO向けの問い合わせは初期選択を "pico" に設定し、通知先の振り分けに使います。 */}
          <ContactForm defaultInquiryType="pico" />
        </div>
      </main>
    </Layout>
  );
};

export default ContactPicoPage;
