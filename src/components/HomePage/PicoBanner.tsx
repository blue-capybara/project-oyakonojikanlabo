import React from 'react';
import { Link } from 'react-router-dom';
import { withBase } from '../../utils/paths';

const PicoBanner: React.FC = () => {
  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            <div className="w-full sm:w-1/2">
              <img 
                src={withBase('images/readdy/4d75a49af6fc29ff5c1b0b5c783a3be8.jpeg')} 
                alt="豊中PICO" 
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="w-full sm:w-1/2 p-8 flex flex-col justify-center">
              <div className="mb-6">
                <img 
                  src={withBase('images/readdy/39e5fc488b56e7ee83d85b9a01bb3b4c.png')} 
                  alt="PICO豊中" 
                  className="h-16 w-auto"
                />
              </div>
              <p className="text-lg text-gray-600 mb-6">
                大阪・豊中にある、「親子の時間研究所」のちいさなお店です。<br /><br />
                絵本や絵本グッズの販売にくわえて、読み聞かせや作家さんとのイベント、原画の展示もいろいろ。<br /><br />
                親子でたのしむのはもちろん、大人の方がひとりでふらっと来ても、のんびりできる場所です。
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-start">
                  <div className="w-6 h-6 flex items-center justify-center mr-2 text-primary">
                    <i className="ri-book-open-line"></i>
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">絵本サロン＆カフェ</h3>
                    <p className="text-sm text-gray-600">作家コラボのアート雑貨と1,000冊以上の絵本が並ぶ専門書店</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 flex items-center justify-center mr-2 text-primary">
                    <i className="ri-palette-line"></i>
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">キッズスクール</h3>
                    <p className="text-sm text-gray-600">創造性を育む子ども向けプログラム</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 flex items-center justify-center mr-2 text-primary">
                    <i className="ri-cup-line"></i>
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">カルチャースクール</h3>
                    <p className="text-sm text-gray-600">大人もPICO！地域密着型カルチャースクール。</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 flex items-center justify-center mr-2 text-primary">
                    <i className="ri-building-2-line"></i>
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">レンタルスペース</h3>
                    <p className="text-sm text-gray-600">イベントやワークショップに最適な多目的スペース</p>
                  </div>
                </div>
              </div>
              <Link to="/pico">
                <button className="bg-primary text-white px-6 py-3 font-medium self-start rounded-button whitespace-nowrap">
                  詳しく見る
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PicoBanner;
