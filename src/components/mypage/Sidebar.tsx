import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

type TabType = 'profile' | 'reservations' | 'purchases' | 'favorites' | 'settings';

type Props = {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
};

const Sidebar: React.FC<Props> = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const [memberName, setMemberName] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setMemberName(user.user_metadata?.name || 'ゲストユーザー');
      }
    });
  }, []);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  const menuItems: { id: TabType; label: string; icon: string }[] = [
    { id: 'profile' as const, label: 'プロフィール', icon: 'ri-user-3-line' },
    { id: 'reservations' as const, label: '予約履歴', icon: 'ri-calendar-check-line' },
    { id: 'purchases' as const, label: '購入履歴', icon: 'ri-shopping-bag-line' },
    { id: 'favorites' as const, label: 'お気に入り', icon: 'ri-heart-line' },
    { id: 'settings' as const, label: '設定', icon: 'ri-settings-3-line' },
  ];

  return (
    <aside className="lg:w-64 flex-shrink-0">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center mb-6">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mr-4">
            <i className="ri-user-3-line ri-xl text-gray-500"></i>
          </div>
          <div>
            <h2 className="font-bold text-lg">{memberName}</h2>
            <p className="text-gray-500 text-sm">会員ステータス：一般会員</p>
          </div>
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left flex items-center py-3 px-4 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-primary/5 text-primary font-medium'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-primary'
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center mr-3">
                <i className={item.icon}></i>
              </div>
              <span>{item.label}</span>
            </button>
          ))}

          {/* 以下「プレミアム会員になる」ブロックはそのまま維持 */}
          <div className="nav-item bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <i className="ri-vip-crown-line text-primary"></i>
              </div>
              <span className="text-xs font-medium text-gray-400 px-2 py-1 bg-white rounded-full">
                準備中
              </span>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">プレミアム会員になる</h3>
            <p className="text-sm text-gray-600 mb-3">
              日々がちょっと楽しくなる特典を考えています。
              <br />
              ご案内まで、もうしばらくお待ちください。
            </p>
            <ul className="text-sm text-gray-600 mb-4 space-y-2">
              <li className="flex items-center">
                <div className="w-4 h-4 flex items-center justify-center mr-2 text-gray-400">
                  <i className="ri-check-line"></i>
                </div>
                イベントの優先予約
              </li>
              <li className="flex items-center">
                <div className="w-4 h-4 flex items-center justify-center mr-2 text-gray-400">
                  <i className="ri-check-line"></i>
                </div>
                限定コンテンツ
              </li>
              <li className="flex items-center">
                <div className="w-4 h-4 flex items-center justify-center mr-2 text-gray-400">
                  <i className="ri-check-line"></i>
                </div>
                アーティストとつくるグッズ
              </li>
              <li className="flex items-center">
                <div className="w-4 h-4 flex items-center justify-center mr-2 text-gray-400">
                  <i className="ri-check-line"></i>
                </div>
                年に数回の読みもの冊子など
              </li>
            </ul>
            <button
              disabled
              className="w-full bg-gray-200 text-gray-500 px-4 py-2 font-medium !rounded-button whitespace-nowrap cursor-not-allowed flex items-center justify-center"
            >
              準備中
              <div className="w-4 h-4 flex items-center justify-center ml-1">
                <i className="ri-time-line"></i>
              </div>
            </button>
          </div>
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-bold text-lg mb-4">サポート</h3>
        <div className="space-y-3">
          <a href="#" className="flex items-center text-gray-700 hover:text-primary">
            <div className="w-5 h-5 flex items-center justify-center mr-3">
              <i className="ri-question-line"></i>
            </div>
            <span>よくある質問</span>
          </a>
          <a href="#" className="flex items-center text-gray-700 hover:text-primary">
            <div className="w-5 h-5 flex items-center justify-center mr-3">
              <i className="ri-customer-service-2-line"></i>
            </div>
            <span>お問い合わせ</span>
          </a>
          <a
            href="#"
            onClick={handleLogout}
            className="flex items-center text-gray-700 hover:text-primary"
          >
            <div className="w-5 h-5 flex items-center justify-center mr-3">
              <i className="ri-logout-box-r-line"></i>
            </div>
            <span>ログアウト</span>
          </a>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
