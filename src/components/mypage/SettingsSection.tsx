// src/components/mypage/SettingsSection.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const SettingsSection: React.FC = () => {
  const [newEmail, setNewEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setNewEmail(user.email || '');
        setNewUserName(user.user_metadata?.name || '');
      }
    });
  }, []);

  const handleEmailChange = async () => {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setMessage(error ? `メール変更失敗: ${error.message}` : 'メールアドレスを変更しました');
  };

  const handleUserNameChange = async () => {
    const { error } = await supabase.auth.updateUser({
      data: { name: newUserName },
    });
    setMessage(error ? `ユーザー名変更失敗: ${error.message}` : 'ユーザー名を変更しました');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setMessage('新しいパスワードと確認用が一致しません');
      return;
    }
    const { error } = await supabase.auth.updateUser({
      password: passwords.new,
    });
    setMessage(error ? `パスワード変更失敗: ${error.message}` : 'パスワードを変更しました');
  };

  const handleDeleteAccount = () => {
    alert('この操作はクライアント側では実行できません。運営までご連絡ください。');
  };

  return (
    <section id="settings-section">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold mb-6 pb-2 border-b border-gray-200">設定</h2>

        {/* 通知設定 */}
        <div className="mb-8">
          <h3 className="font-bold text-lg mb-4">通知設定</h3>
          <div className="space-y-4">
            {[
              {
                label: 'ニュースレター配信',
                desc: '新着情報やお得な情報をメールでお届けします',
                checked: true,
              },
              {
                label: 'イベント通知',
                desc: 'お住まいのエリアで新しいイベントが追加された際にメールします',
                checked: true,
              },
              {
                label: '予約リマインダー',
                desc: 'イベント開催の前日にリマインドメールを送信します',
                checked: true,
              },
              {
                label: 'お気に入り更新通知',
                desc: 'お気に入りに登録したコンテンツの更新をお知らせします',
                checked: false,
              },
            ].map((item, index) => (
              <div className="flex items-center justify-between" key={index}>
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                <label className="custom-switch">
                  <input type="checkbox" defaultChecked={item.checked} />
                  <span className="switch-slider"></span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* アカウント設定 */}
        <div className="mb-8">
          <h3 className="font-bold text-lg mb-4">アカウント設定</h3>
          <div className="space-y-4">
            {/* メール変更 */}
            <div>
              <label htmlFor="email-change" className="block font-medium mb-2">メールアドレス変更</label>
              <div className="flex">
                <input
                  type="email"
                  id="email-change"
                  className="flex-grow border border-gray-300 rounded-l-button py-2 px-4 text-gray-700"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <button
                  onClick={handleEmailChange}
                  className="bg-primary text-white px-4 py-2 font-medium !rounded-r-button hover:bg-primary/90 transition-colors"
                >
                  変更
                </button>
              </div>
            </div>

            {/* ユーザー名変更 */}
            <div>
              <label htmlFor="username-change" className="block font-medium mb-2">ユーザー名変更</label>
              <div className="flex">
                <input
                  type="text"
                  id="username-change"
                  className="flex-grow border border-gray-300 rounded-l-button py-2 px-4 text-gray-700"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
                <button
                  onClick={handleUserNameChange}
                  className="bg-primary text-white px-4 py-2 font-medium !rounded-r-button hover:bg-primary/90 transition-colors"
                >
                  変更
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button onClick={handleDeleteAccount} className="text-red-600 hover:text-red-700 flex items-center">
              <div className="w-5 h-5 flex items-center justify-center mr-2">
                <i className="ri-delete-bin-line"></i>
              </div>
              アカウントを削除
            </button>
          </div>
        </div>

        {/* パスワード変更 */}
        <div>
          <h3 className="font-bold text-lg mb-4">パスワード変更</h3>
          <form className="space-y-4" onSubmit={handlePasswordChange}>
            <div>
              <label className="block font-medium mb-2">新しいパスワード</label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-button py-2 px-4 text-gray-700"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                placeholder="新しいパスワードを入力"
              />
              <p className="text-sm text-gray-500 mt-1">8文字以上で、英字・数字を含めてください</p>
            </div>
            <div>
              <label className="block font-medium mb-2">パスワード確認</label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-button py-2 px-4 text-gray-700"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                placeholder="新しいパスワードを再入力"
              />
            </div>
            <div className="pt-2">
              <button type="submit" className="bg-primary text-white px-6 py-2 font-medium !rounded-button hover:bg-primary/90 transition-colors">
                パスワードを変更
              </button>
            </div>
          </form>
        </div>

        {message && (
          <div className="mt-6 p-3 bg-blue-50 text-sm text-blue-700 rounded">
            {message}
          </div>
        )}
      </div>
    </section>
  );
};

export default SettingsSection;
