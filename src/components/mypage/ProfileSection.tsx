// src/components/mypage/ProfileSection.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const ProfileSection: React.FC = () => {
  const [userName, setUserName] = useState('ゲストユーザー');
  const [email, setEmail] = useState('メールアドレス不明');
  const [phone, setPhone] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [lastLogin, setLastLogin] = useState('');
  const [address, setAddress] = useState('');
  const [birthday, setBirthday] = useState('');
  const [newsletter, setNewsletter] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserName(user.user_metadata?.name || 'ゲストユーザー');
      setEmail(user.email || 'メールアドレス不明');
      setPhone(user.user_metadata?.phone || '');
      setCreatedAt(user.created_at || '');
      setLastLogin(user.user_metadata?.last_login || '');
      setAddress(user.user_metadata?.address || '');
      setBirthday(user.user_metadata?.birthday || '');
      setNewsletter(user.user_metadata?.newsletter || false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({
      email,
      data: {
        name: userName,
        phone,
        birthday,
        address,
        newsletter,
        last_login: new Date().toISOString(),
      },
    });
    if (error) {
      alert('更新に失敗しました: ' + error.message);
    } else {
      alert('プロフィールを更新しました');
      closeModal();
      fetchUser();
    }
  };

  return (
    <>
      <section id="profile-section">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-6 pb-2 border-b border-gray-200">プロフィール情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">基本情報</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">氏名</p>
                  <p className="font-medium">{userName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">メールアドレス</p>
                  <p className="font-medium">{email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">電話番号</p>
                  <p className="font-medium">{phone || '未登録'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-2">会員情報</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">会員ステータス</p>
                  <p className="font-medium">一般会員</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">登録日</p>
                  <p className="font-medium">
                    {createdAt ? new Date(createdAt).toLocaleDateString() : '不明'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">最終ログイン</p>
                  <p className="font-medium">
                    {lastLogin ? new Date(lastLogin).toLocaleString() : '記録なし'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={openModal}
              className="bg-primary text-white px-6 py-2 font-medium rounded-button hover:bg-primary/90 transition-colors flex items-center"
            >
              <i className="ri-edit-line mr-2"></i>プロフィールを編集
            </button>
          </div>
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 p-6 relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">プロフィール編集</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <i className="ri-close-line ri-lg"></i>
              </button>
            </div>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-medium mb-2">氏名</label>
                  <input type="text" value={userName} onChange={e => setUserName(e.target.value)} className="w-full border rounded-button py-2 px-4" />
                </div>
                <div>
                  <label className="block font-medium mb-2">メールアドレス</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded-button py-2 px-4" />
                </div>
                <div>
                  <label className="block font-medium mb-2">電話番号</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border rounded-button py-2 px-4" />
                </div>
                <div>
                  <label className="block font-medium mb-2">生年月日</label>
                  <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} className="w-full border rounded-button py-2 px-4" />
                </div>
              </div>
              <div>
                <label className="block font-medium mb-2">住所</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full border rounded-button py-2 px-4" />
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={newsletter} onChange={e => setNewsletter(e.target.checked)} />
                  <span>お知らせやイベント情報を受け取る</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={closeModal} className="border px-6 py-2 rounded-button">キャンセル</button>
                <button type="submit" className="bg-primary text-white px-6 py-2 rounded-button">保存する</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileSection;
