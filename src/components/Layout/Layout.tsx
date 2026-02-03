import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import useHeaderHeight from '../../hooks/useHeaderHeight';
import { supabase } from '../../lib/supabaseClient';

interface LayoutProps {
  children: React.ReactNode;
  showNewsletter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showNewsletter = false }) => {
  const headerHeight = useHeaderHeight();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState<string | null>(null);
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);

  const handleNewsletterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newsletterSubmitting) return;

    const email = newsletterEmail.trim();
    if (!email) {
      setNewsletterMessage('メールアドレスを入力してください。');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setNewsletterMessage('メールアドレスの形式が正しくありません。');
      return;
    }

    setNewsletterSubmitting(true);
    setNewsletterMessage(null);

    try {
      const { data, error } = await supabase.functions.invoke('register_newsletter', {
        body: { email },
      });

      if (error || !data?.ok) {
        throw error ?? new Error(data?.error ?? '登録に失敗しました。');
      }

      setNewsletterMessage('登録が完了しました。ご利用ありがとうございます。');
      setNewsletterEmail('');
    } catch (err) {
      console.error('Newsletter subscription failed', err);
      setNewsletterMessage('登録に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      <Header />
      <main
        className="flex-1"
        style={{ paddingTop: headerHeight ? `${headerHeight}px` : undefined }}
      >
        {children}
      </main>
      {showNewsletter && (
        <section className="py-16 bg-primary text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-4">親子の時間研究所ニュースレター会員（無料）</h2>
              <p className="mb-8">
                新作絵本グッズのご紹介や作家インタビュー、イベント案内など、カルチャーあふれるニュースレターをお届けします。
              </p>
              <form className="flex flex-col gap-4 max-w-lg mx-auto" onSubmit={handleNewsletterSubmit}>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(event) => setNewsletterEmail(event.target.value)}
                    placeholder="メールアドレス"
                    className="px-4 py-3 rounded-lg border-none text-gray-800 w-full text-sm"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-white text-primary px-8 py-3 rounded-lg font-medium hover:bg-yellow-300 hover:text-white transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                    disabled={newsletterSubmitting}
                  >
                    {newsletterSubmitting ? '送信中...' : '登録する'}
                  </button>
                </div>
              </form>
              {newsletterMessage && <p className="text-sm mt-4 text-white/80">{newsletterMessage}</p>}
              <p className="text-sm mt-4 text-white/80">※登録することで親子の時間研究所STOREのメールマガジン購読に登録されます。</p>
              <p className="text-sm mt-4 text-white/80">※登録は無料です。いつでも解除できます。</p>
            </div>
          </div>
        </section>
      )}
      <Footer />
    </div>
  );
};

export default Layout;
