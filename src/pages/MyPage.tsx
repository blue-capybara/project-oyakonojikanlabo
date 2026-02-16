// src/pages/MyPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import Sidebar from '../components/mypage/Sidebar';
import ProfileSection from '../components/mypage/ProfileSection';
import ReservationSection from '../components/mypage/ReservationSection';
import FavoriteSection from '../components/mypage/FavoriteSection';
import PurchaseSection from '../components/mypage/PurchaseSection';
import SettingsSection from '../components/mypage/SettingsSection';
import Breadcrumb from '../components/Breadcrumb';
import Seo from '../components/seo/Seo';
import { shouldNoIndex } from '../utils/seo';
import { supabase } from '../lib/supabaseClient';
import useHeaderHeight from '../hooks/useHeaderHeight';

const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    'profile' | 'reservations' | 'purchases' | 'favorites' | 'settings'
  >('reservations');
  const headerHeight = useHeaderHeight();
  const noindex = shouldNoIndex({ force: true });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate('/login', { replace: true });
      } else {
        //last_login を現在時刻で記録（Googleログイン時も対応）
        const now = new Date().toISOString();
        const update = await supabase.auth.updateUser({
          data: { last_login: now },
        });

        if (update.error) {
          console.warn('last_login 記録に失敗:', update.error.message);
        }
      }
    });
  }, [navigate]);

  return (
    <>
      <Seo title="マイページ" description="会員専用ページ" noindex={noindex} />
      <Header />
      <div
        className="px-4 bg-gray-50 min-h-screen"
        style={{ paddingTop: headerHeight ? `${headerHeight}px` : undefined }}
      >
        <Breadcrumb items={[{ label: 'HOME', to: '/' }, { label: 'マイページ' }]} />

        <div className="container mx-auto max-w-[1536px] flex flex-col lg:flex-row gap-6">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="flex-grow">
            {activeTab === 'profile' && <ProfileSection />}
            {activeTab === 'reservations' && <ReservationSection />}
            {activeTab === 'purchases' && <PurchaseSection />}
            {activeTab === 'favorites' && <FavoriteSection />}
            {activeTab === 'settings' && <SettingsSection />}
          </div>
        </div>
      </div>
    </>
  );
};

export default MyPage;
