import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import Seo from '../components/seo/Seo';
import { shouldNoIndex } from '../utils/seo';
import { supabase } from '../lib/supabaseClient';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const noindex = shouldNoIndex({ force: true });
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/mypage', { replace: true });
      }
    });
  }, [navigate]);

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    setMessage(`ログイン失敗: ${error?.message ?? '不明なエラー'}`);
    return;
  }

  // ✅ last_login を現在時刻で記録
  const now = new Date().toISOString();
  const update = await supabase.auth.updateUser({
    data: { last_login: now },
  });

  if (update.error) {
    console.warn('last_loginの記録に失敗しました:', update.error.message);
  }

  navigate('/mypage', { replace: true });
};

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) setMessage(`Google認証エラー: ${error.message}`);
  };

	return (
		<Layout showNewsletter={false}>
      <Seo title="ログイン" description="会員ログインページ" noindex={noindex} />
    <div className="container mx-auto px-4 py-12 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">ログイン</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border p-2 w-full rounded"
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border p-2 w-full rounded"
        />
        {message && <p className="text-sm text-red-500">{message}</p>}
        <button type="submit" className="bg-primary text-white px-4 py-2 rounded w-full">
          ログイン
        </button>
      </form>

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
        onClick={handleGoogleLogin}
        className="flex items-center justify-center gap-2 w-full border border-gray-300 rounded px-4 py-2 hover:bg-gray-50"
      >
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
        <span>Googleでログイン</span>
      </button>
			</div>
			<div className="text-center mt-6 text-sm">
  アカウントをお持ちでない方は{' '}
  <a href="/signup" className="text-primary hover:underline">
    新規登録はこちら
  </a>
</div>
			</Layout>
  );
};

export default Login;
