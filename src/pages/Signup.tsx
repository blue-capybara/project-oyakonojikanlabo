import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import Seo from '../components/seo/Seo';
import { shouldNoIndex } from '../utils/seo';
import { supabase } from '../lib/supabaseClient';
import { syncCustomerOnSignup } from '../lib/shopifySync';
import { sendSignupCompleteEvent } from '../lib/ga';

const Signup: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/mypage', { replace: true });
      }
    });
  }, [navigate]);

  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreement: false,
    storeConsent: false,
  });

  const [message, setMessage] = useState('');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const noindex = shouldNoIndex({ force: true });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const { lastName, firstName, email, password, confirmPassword, agreement, storeConsent } = formData;

    if (!agreement) return setMessage('利用規約に同意してください。');
    if (password !== confirmPassword) return setMessage('パスワードが一致していません。');
    if (!password.match(/(?=.*[A-Z])(?=.*\d).{8,}/))
      return setMessage('パスワードは8文字以上で数字と大文字を含めてください。');

    setIsSubmitting(true);
    setMessage('');
    setSyncNotice(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: `${lastName} ${firstName}`,
            store_consent: storeConsent,
          },
        },
      });

      if (error) {
        setMessage(`登録エラー: ${error.message}`);
        return;
      }

      setMessage('登録成功！確認メールを送信しました。');
      sendSignupCompleteEvent({ method: 'email', store_consent: storeConsent });

      const userId = data?.user?.id;
      if (userId) {
        try {
          const { error: consentError } = await supabase
            .from('profiles')
            .update({ store_consent: storeConsent })
            .eq('id', userId);
          if (consentError) {
            console.error('Failed to persist store consent', consentError);
          }
        } catch (profileErr) {
          console.error('Unexpected error while updating profile consent', profileErr);
        }

        try {
          if (storeConsent) {
            setSyncNotice('親子の時間研究所STOREとの連携を実行しています...');
            await syncCustomerOnSignup({ email, userId, consent: true });
            setSyncNotice('親子の時間研究所STOREとの連携が完了しました。');
          } else {
            setSyncNotice('親子の時間研究所STOREとの連携は、ご希望の場合にマイページから設定できます。');
          }
        } catch (syncErr) {
          console.error('Store sync failed', syncErr);
          setSyncNotice('親子の時間研究所STOREとの連携に失敗しました。時間をおいて再試行されるか、サポートへお問い合わせください。');
        }
      } else {
        setSyncNotice('親子の時間研究所STOREとの連携はメール確認後に実行されます。');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setMessage('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/mypage`,
      },
    });
    if (error) {
      setMessage(`Google認証エラー: ${error.message}`);
    }
  };

	return (
		<Layout showNewsletter={false}>
      <Seo title="新規登録" description="会員登録ページ" noindex={noindex} />
    <div className="container mx-auto px-4 py-12 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">新規登録</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input name="lastName" placeholder="姓" onChange={handleChange} required className="border p-2 w-full rounded" />
          <input name="firstName" placeholder="名" onChange={handleChange} required className="border p-2 w-full rounded" />
        </div>
        <input name="email" type="email" placeholder="メールアドレス" onChange={handleChange} required className="border p-2 w-full rounded" />
        <input name="password" type="password" placeholder="パスワード" onChange={handleChange} required className="border p-2 w-full rounded" />
        <input name="confirmPassword" type="password" placeholder="パスワード（確認）" onChange={handleChange} required className="border p-2 w-full rounded" />
        <label className="block text-sm">
          <input type="checkbox" name="agreement" onChange={handleChange} className="mr-2" />
          <span>利用規約に同意します</span>
        </label>
        <label className="block text-sm">
          <input type="checkbox" name="storeConsent" onChange={handleChange} className="mr-2" />
          <span>
            <a
              href="https://shop.oyakonojikanlabo.jp/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              親子の時間研究所STORE
            </a>
            にも登録して最新情報を受け取る
          </span>
        </label>
        {message && <p className="text-sm text-red-500">{message}</p>}
        {syncNotice && <p className="text-sm text-gray-600">{syncNotice}</p>}
        <button
          type="submit"
          className="bg-primary text-white px-4 py-2 rounded w-full disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? '処理中...' : 'アカウント作成'}
        </button>
        <div className="text-center mt-4 text-sm">
          <Link to="/login" className="text-primary hover:underline">すでにアカウントをお持ちの方はこちら</Link>
        </div>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">または</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleGoogleSignup}
          className="flex items-center justify-center gap-2 w-full border border-gray-300 rounded px-4 py-2 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          <span>Googleアカウントで登録</span>
        </button>
      </form>
			</div>
			</Layout>
  );
};

export default Signup;
