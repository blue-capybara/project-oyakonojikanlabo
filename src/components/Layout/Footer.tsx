import React from 'react';
import { Link } from 'react-router-dom';
import { sendOutboundClickEvent } from '../../lib/ga';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const showPicoMenu = false; // TODO: 豊中PICOメニュー復活時に true へ戻す
  const showOrganizerLoginLinks = false; // TODO: 主催者ログイン復活時に true へ戻す

  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="mb-4">
              <img 
                src="https://public.readdy.ai/ai/img_res/35857e6b-21d5-41ce-9f29-aa2ddfa06fc3.png" 
                alt="親子の時間研究所" 
                className="h-12 w-auto"
              />
            </h3>
            <p className="text-gray-400 mb-4">
              絵本やアート、カルチャー、そして日々のくらしのこと。 あれこれ気になることを、たのしくお届けしています。
            </p>
            <div className="flex space-x-4">
              <a href="https://x.com/oyakonojikan" className="text-gray-400 hover:text-white">
                <div className="w-8 h-8 flex items-center justify-center">
                  <i className="ri-twitter-x-line ri-lg"></i>
                </div>
              </a>
              <a href="https://www.instagram.com/oyako_jikan_labo/" className="text-gray-400 hover:text-white">
                <div className="w-8 h-8 flex items-center justify-center">
                  <i className="ri-instagram-line ri-lg"></i>
                </div>
              </a>
              <a href="https://www.facebook.com/oyakonojikanlabo" className="text-gray-400 hover:text-white">
                <div className="w-8 h-8 flex items-center justify-center">
                  <i className="ri-facebook-circle-line ri-lg"></i>
                </div>
              </a>
              <a href="https://www.youtube.com/@oyakolabo" className="text-gray-400 hover:text-white">
                <div className="w-8 h-8 flex items-center justify-center">
                  <i className="ri-youtube-line ri-lg"></i>
                </div>
              </a>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">コンテンツ</h3>
            <ul className="space-y-2">
              <li><Link to="https://shop.oyakonojikanlabo.jp/" className="text-gray-400 hover:text-white" onClick={() => sendOutboundClickEvent({ url: 'https://shop.oyakonojikanlabo.jp/', link_text: 'おかいもの' })}>おかいもの</Link></li>
              <li><a href="https://ehonyasan-moe.oyakonojikanlabo.jp/socks/" className="text-gray-400 hover:text-white" onClick={() => sendOutboundClickEvent({ url: 'https://ehonyasan-moe.oyakonojikanlabo.jp/socks/', link_text: '絵本の靴下' })}>絵本の靴下</a></li>
              <li><Link to="/event" className="text-gray-400 hover:text-white">イベント</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-white">親子の時間研究所について</Link></li>
            </ul>
          </div>
          {showPicoMenu && (
            <div>
              <h3 className="font-bold text-lg mb-4">豊中PICO</h3>
              <ul className="space-y-2">
                <li><Link to="/pico#salon" className="text-gray-400 hover:text-white">絵本サロン</Link></li>
                <li><Link to="/pico#kids" className="text-gray-400 hover:text-white">キッズスクール</Link></li>
                <li><Link to="/culture-school" className="text-gray-400 hover:text-white">カルチャースクール</Link></li>
                <li><Link to="/pico#rental" className="text-gray-400 hover:text-white">レンタルスペース</Link></li>
                <li><Link to="/pico#access" className="text-gray-400 hover:text-white">アクセス</Link></li>
              </ul>
            </div>
          )}
          <div>
            <h3 className="font-bold text-lg mb-4">企業情報</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-400 hover:text-white">会社概要</Link></li>
              <li><Link to="/privacy" className="text-gray-400 hover:text-white">プライバシーポリシー</Link></li>
              <li><Link to="/notationbased" className="text-gray-400 hover:text-white">特定商取引法に基づく表記</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white">お問い合わせ</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-8 text-center">
          {showOrganizerLoginLinks && (
            <div className="flex justify-center gap-4 mb-4">
              <Link to="/event-organizer-login" className="inline-flex items-center justify-center text-gray-400 text-sm hover:text-white transition-colors">
                <div className="w-5 h-5 flex items-center justify-center mr-1">
                  <i className="ri-login-box-line"></i>
                </div>
                イベント主催者ログイン
              </Link>
              <Link to="/corporate-login" className="inline-flex items-center justify-center text-gray-400 text-sm hover:text-white transition-colors">
                <div className="w-5 h-5 flex items-center justify-center mr-1">
                  <i className="ri-building-line"></i>
                </div>
                法人イベント主催者ログイン
              </Link>
            </div>
          )}
          <p className="text-gray-500">&copy; {currentYear} 親子の時間研究所 All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
