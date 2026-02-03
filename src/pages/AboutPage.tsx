import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import Breadcrumb from '../components/Breadcrumb';
import { withBase } from '../utils/paths';

const AboutPage: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Layout showNewsletter={false}>
      <Breadcrumb
        items={[
          { label: 'ホーム', to: '/' },
          { label: '親子の時間研究所について' },
        ]}
      />

      {/* 会社概要ヘッダー */}
      <section className="relative py-16 bg-gradient-to-r from-primary/90 to-primary/80">
        <div className="absolute inset-0 w-full h-full">
          <img 
            src={withBase('images/readdy/seq1-landscape-a-warm-and-inviting-office-space.jpg')} 
            alt="親子の時間研究所オフィス" 
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center mb-8">
            <Link to="/" className="flex items-center text-white hover:text-gray-200 transition-colors">
              <div className="w-5 h-5 flex items-center justify-center mr-1">
                <i className="ri-arrow-left-line"></i>
              </div>
              <span>戻る</span>
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">親子の時間研究所</h1>
          <p className="text-white text-xl max-w-2xl">絵本のように、暮らそう。</p>
          <p className="text-white text-lg mt-4 max-w-2xl">
            大人になった私たちが、深呼吸できる場所。<br />
            忙しい日々に追われて、ふと立ち止まりたくなる時。<br />
            ページをめくれば、いつでも優しい世界に帰れたあの頃のように。<br />
            私たち「親子の時間研究所」が提案するのは、<br />
            「絵本のような暮らし」です。
          </p>
           <p className="text-white text-lg mt-4 max-w-2xl">
            それは、色彩豊かで、温もりがあって、ちょっと不思議な世界。<br />
            お気に入りのカップひとつで、朝の空気が変わるように。<br />
            遊び心のあるアクセサリーで、背筋がすっと伸びるように。<br />
            ここにあるのは、子供のための道具だけではありません。

          </p>
          <p className='text-white text-lg mt-4 max-w-2xl'>
            「かつて子供だった大人」が、<br />
            素顔の自分に戻り、心を遊ばせるためのライフスタイルです。<br />
            日常に、物語のような彩りと余白を。
          </p>
          <p className='text-white text-lg mt-4 max-w-2xl'>
            さあ、あなただけの「絵本のような時間」を始めませんか。
          </p>
        </div>
      </section>

      {/* 企業理念・ストーリーセクション */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12">
              <h2 className="text-lg font-bold text-center mb-16">「親子の時間研究所」の、これまでとこれから</h2>
              <div className="text-gray-600 mt-8 text-base leading-relaxed space-y-6">
                <div>
                  <p className="mb-8">「親子の時間研究所」という名前のチームがあります。</p>
                  <p className="mb-8">はじまりは、2010年ごろのことでした。</p>
                  <p className="mb-8">「大人も子どもも、いっしょにあそんで、いっしょにまなぶ」って、なんだかいいよねと。</p>
                  <p className="mb-8">親子のコミュニケーションをテーマにした、ものづくりのチームを会社のなかにつくったのです。</p>
                  <p className="mb-8">そこから、いろんなものが生まれてきました。</p>
                </div>
                <div className={`transition-all duration-700 ease-in-out overflow-hidden ${isExpanded ? 'max-h-none' : 'max-h-0'}`}>
                  <p className="mb-12">たとえば──</p>
                  <p className="mb-12">本物の石にふれられる「天然石コレクション」は、<br />子どもたちのポケットや宝箱のなかに、ひとつずつ、大切にしまわれていきました。</p>
                  <p className="mb-12">図鑑の世界を、手のひらでたしかめられる<a href="https://zukan.oyakonojikanlabo.jp/" className="text-primary hover:underline">「触れる図鑑」</a>は、<br />観察したり、磨いたり、試してみたり。<br />「なにこれ！」の声といっしょに、たくさんの家庭に届いています。</p>
                  <p className="mb-12">2016年にうまれた<a href="https://osora-no-ehon.oyakonojikanlabo.jp/" className="text-primary hover:underline">「おそらの絵本」</a>は、<br />スマートフォンの灯りを使って、天井に絵を映す読み聞かせツール。<br />寝るまえの部屋のあかりや、親子の会話をすこしやさしく変えてくれました。</p>
                  <p className="mb-12">2020年の<a href="https://ehonyasan-moe.oyakonojikanlabo.jp/socks/" className="text-primary hover:underline">「絵本のくつした」</a>は、<br />いろんな足もとに、小さな物語を届けてきました。<br />朝の通学路にも、家のなかの休日にも、<br />絵本の世界がふわっと混ざるようなアイテムです。</p>
                  <p className="mb-12">気づけば、子どもの数が減っているといわれるこの国でも、<br />「なんかいいね」と思ってもらえるものが、<br />ずっと、ぽつりぽつりと生まれてきました。</p>
                  <p className="mb-12">でも、これはぼくらだけでできたことじゃありません。</p>
                  <p className="mb-12">社内の仲間たちと、社外の「つくる人」たちと、そして、絵本作家さんやアーティストのみなさんと、いっしょに手を動かして、かたちにしてきたものなんです。</p>
                  <p className="mb-12">ちょっと余談のような話ですが──</p>
                  <p className="mb-12">15年走ってきたなかで、見えてきたことがあります。</p>
                  <p className="mb-12">「あそぶ、まなぶ」って、親子だけのものじゃなかったんです。</p>
                  <p className="mb-12">おじいちゃんやおばあちゃん。</p>
                  <p className="mb-12">ひとりで暮らす大人の女性にも、ちゃんと届いていました。</p>
                  <p className="mb-12">なんだか、ジブリの世界にも似てるなあって。</p>
                  <p className="mb-12">トトロのいる森も、ハウルの動く城も、子どもの世界のようでいて、大人の心にもしっかり届いてくる。</p>
                  <p className="mb-12">「これって、子どものためのものですよね？」と聞かれたら、</p>
                  <p className="mb-12">「はい、そうです」と答えるけれど、</p>
                  <p className="mb-12">「でも、大人のためでもあるんです」と、ちょっとだけ付け足したくなる。</p>
                  <p className="mb-12">そんなふうにして、</p>
                  <p className="mb-12">親子でわらって、</p>
                  <p className="mb-12">おじいちゃんおばあちゃんもくすっとして、</p>
                  <p className="mb-12">ひとりで暮らす誰かの夜にもそっと寄り添う。</p>
                  <p className="mb-12">そういう「もの」や「時間」ができたらいいなと思って、</p>
                  <p className="mb-12">ぼくらはずっと、手を動かしてきました。</p>
                  <p className="mb-12">そして、2025年。</p>
                  <p className="mb-12">大阪・豊中に、小さなお店をひらきました。</p>
                  <p className="mb-12">ここからまた、新しいつながりが生まれる気がしています。</p>
                  <p className="mb-12">子どもと大人。</p>
                  <p className="mb-12">街と「つくる人」。</p>
                  <p className="mb-12">ジャンルとジャンルのあいだ。</p>
                  <p className="mb-12">そのあいだにある、まだ名前のついていない場所へ。</p>
                  <p className="mb-12">「親子の時間研究所」は、これからも、つくる旅をつづけます。</p>
                </div>
                
                <button 
                  onClick={toggleExpanded}
                  className="group mt-12 px-8 py-4 bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-full transition-all duration-300 text-base font-medium flex items-center mx-auto"
                >
                  <span className="group-hover:translate-y-0 transition-transform">
                    {isExpanded ? 'とじる' : 'ここから、ちょっと長い話になります'}
                  </span>
                  <div className="w-5 h-5 flex items-center justify-center ml-2 group-hover:rotate-90 transition-transform">
                    <i className={`ri-arrow-${isExpanded ? 'up' : 'right'}-line`}></i>
                  </div>
                </button>
              </div>
            </div>

            {/* 事業紹介 */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="space-y-8">
                <div className="flex flex-row gap-4 items-center">
                  <div className="w-32 h-32 flex-shrink-0">
                    <img src={withBase('images/readdy/c74982b90d7d0f308f80641faf733deb.png')} alt="親子の時間研究所" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-4">親子の時間研究所</h3>
                    <p className="text-gray-600">「親子の時間研究所」のウェブサイトです。絵本やアート、デザイン、カルチャー、そして日々のくらしのこと。あれこれ気になることを、たのしくお届けしています。</p>
                  </div>
                </div>

                <div className="border-t border-gray-300"></div>

                <div className="flex flex-row gap-4 items-center">
                  <div className="w-32 h-32 flex-shrink-0">
                    <img src="https://public.readdy.ai/ai/img_res/913a4a13-87bb-440a-891f-7df6cd44d106.jpg" alt="絵本のくつした" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-4">絵本のくつした</h3>
                    <p className="text-gray-600">ロングセラーの絵本たちが、くつしたになりました。はきごこちのいい生地にこだわってつくったので、子どもにも、大人にも、ずっと愛されつづけています。「絵本のあるくらし」を、足もとから、そっとたのしめるプロダクトです。</p>
                  </div>
                </div>

                <div className="border-t border-gray-300"></div>

                <div className="flex flex-row gap-4 items-center">
                  <div className="w-32 h-32 flex-shrink-0">
                    <img src={withBase('images/readdy/9986a5a4f251af58ec8bc67333338f16.png')} alt="PICO" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-4">PICO</h3>
                    <p className="text-gray-600">大阪・豊中にできた、ちいさな拠点です。このまちに根ざして、あそびのなかにある"まなび"をたのしみながら、新しいつながりを、ゆっくり探しています。文化の芽がふわっとひらく、そんな場所を目指しています。</p>
                  </div>
                </div>

                <div className="border-t border-gray-300"></div>

                <div className="flex flex-row gap-4 items-center">
                  <div className="w-32 h-32 flex-shrink-0">
                    <img src={withBase('images/readdy/b4ba55a8dd414d9dd52ca1bcffe67f45.png')} alt="えほんやさんMOE" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-4">えほんやさんMOE</h3>
                    <p className="text-gray-600">世代をこえて愛されてきた、絵本のキャラクターたち。そんな仲間が集まった、専門の売り場が「えほんやさんMOE」です。全国のおよそ1,400の書店でお迎えしています。</p>
                  </div>
                </div>

                <div className="flex flex-row gap-4 items-center">
                  <div className="w-32 h-32 flex-shrink-0">
                    <img src={withBase('images/readdy/0ad222446aa36c96b4bd736dce1c7064.png')} alt="SKIP＆LALA" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-4">SKIP＆LALA</h3>
                    <p className="text-gray-600">絵本からふわっと伝わってくる、癒しやノスタルジー。そんな気持ちをたいせつにしてつくった、大人のためのアイテムたちです。忙しい日々のなかで、ちょっとひと息。「これ、なんかいいかも」って思える瞬間を、そばにおいてみませんか。</p>
                  </div>
                </div>

                <div className="flex flex-row gap-4 items-center">
                  <div className="w-32 h-32 flex-shrink-0">
                    <img src={withBase('images/readdy/297ab8644e83e30cdc8487f8cef02bda.jpeg')} alt="触れる図鑑" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-4">触れる図鑑</h3>
                    <p className="text-gray-600">化石をほったり、鉱物をみがいたり。「触れる図鑑」は、あそびながら、自然や社会のしくみを体験できる知育雑貨のシリーズです。好奇心をひらくきっかけが、親子の時間にそっとまざってくるような。そんな、ちょっと不思議でたのしい学びの道具たちです。</p>
                  </div>
                </div>

                <div className="flex flex-row gap-4 items-center">
                  <div className="w-32 h-32 flex-shrink-0">
                    <img src={withBase('images/readdy/25d98455c5b8d64a365d86ead2e64db3.png')} alt="Life is Art" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-4">Life is Art</h3>
                    <p className="text-gray-600">人生は、たったひとつの作品みたいなもの。同じ人生は、どこにもありません。作家の手からうまれた"一点もの"が、あなたの"一点ものの人生"にそっと寄りそいます。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 会社情報セクション */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-xl font-bold">会社情報</h2>
              <p className="text-gray-600 mt-4">
                大阪・豊中にできた、ちいさな拠点です。
                このまちに根ざして、あそびのなかにある"まなび"をたのしみながら、
                新しいつながりを、ゆっくり探しています。
                文化の芽がふわっとひらく、そんな場所を目指しています。
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="flex flex-col items-start mb-8">
                <img src="https://public.readdy.ai/ai/img_res/e00f3a60-5847-48ad-ae9e-f86b6954da96.png" alt="PICO カルチャー&ブックカフェ" className="h-24 mb-6" />
              </div>
              
              <h3 className="text-xl font-bold mb-8 pb-4 border-b border-gray-200">株式会社親子の時間研究所</h3>
              
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-1/3 font-medium text-gray-700">所在地</div>
                  <div className="w-full md:w-2/3 text-gray-600">〒560-0021 大阪府豊中市本町1-2-3 PICOビル3階</div>
                </div>
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-1/3 font-medium text-gray-700">設立</div>
                  <div className="w-full md:w-2/3 text-gray-600">2018年4月</div>
                </div>
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-1/3 font-medium text-gray-700">資本金</div>
                  <div className="w-full md:w-2/3 text-gray-600">1,000万円</div>
                </div>
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-1/3 font-medium text-gray-700">代表者</div>
                  <div className="w-full md:w-2/3 text-gray-600">代表取締役 塩野竜一</div>
                </div>
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-1/3 font-medium text-gray-700">従業員数</div>
                  <div className="w-full md:w-2/3 text-gray-600">10名（パート・アルバイト含む）</div>
                </div>
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-1/3 font-medium text-gray-700">問い合わせ</div>
                  <div className="w-full md:w-2/3 text-gray-600">
                    <a href="mailto:pico@oyakonojikanlabo.jp" className="text-primary hover:underline flex items-center">
                      <div className="w-5 h-5 flex items-center justify-center mr-2">
                        <i className="ri-mail-line"></i>
                      </div>
                      pico@oyakonojikanlabo.jp
                    </a>
                  </div>
                </div>
              </div>

              {/* PICO事業詳細 */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-xl font-bold mb-6">カルチャー＆ブックカフェPICO事業</h3>
                <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto mb-8">
                  このまちに根ざして、あそびのなかにある"まなび"をたのしみながら、新しいつながりを探しています。
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl p-6">
                    <h4 className="font-bold text-lg mb-3 flex items-center">
                      <div className="w-6 h-6 flex items-center justify-center mr-2">
                        <i className="ri-store-2-line text-primary"></i>
                      </div>
                      カルチャー＆ブックストア
                    </h4>
                    <p className="text-gray-600">
                      「あそびながら、まなぶ」体験をお届けします。
                      選びぬかれた絵本や知育コンテンツを通じて、
                      感性と創造性を育みながら、大人の方にも
                      新しい発見や学びのよろこびが見つかる場所です。
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6">
                    <h4 className="font-bold text-lg mb-3 flex items-center">
                      <div className="w-6 h-6 flex items-center justify-center mr-2">
                        <i className="ri-calendar-event-line text-primary"></i>
                      </div>
                      コミュニティ＆カルチャースクール
                    </h4>
                    <p className="text-gray-600">
                      地域の方といっしょに育てていく、参加型のプログラムです。
                      絵本作家さんとの対話や、親子で楽しむワークショップ、
                      アート、音楽、デザインなど、ジャンルをこえた学びの時間をご用意しています。
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6">
                    <h4 className="font-bold text-lg mb-3 flex items-center">
                      <div className="w-6 h-6 flex items-center justify-center mr-2">
                        <i className="ri-home-office-line text-primary"></i>
                      </div>
                      地域の文化拠点
                    </h4>
                    <p className="text-gray-600">
                      ここ大阪・豊中で、文化がそっと芽ばえるような場所に。
                      人が集まり、あそび、まなびにふれる温かな空間をめざしています。
                      子どもたちの想像力を育むイベントや、地域コミュニティの活動の場としてもひらいています。
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6">
                    <h4 className="font-bold text-lg mb-3 flex items-center">
                      <div className="w-6 h-6 flex items-center justify-center mr-2">
                        <i className="ri-book-open-line text-primary"></i>
                      </div>
                      絵本サロン
                    </h4>
                    <p className="text-gray-600">
                      お子さまの興味や成長によりそいながら、
                      専門スタッフが絵本選びをお手伝いします。
                      イベントやワークショップを通じて、あそびの中に
                      文化や芸術がふっとまざる時間をつくっています。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 関連会社セクション */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-xl font-bold">関連会社</h2>
              <p className="text-gray-600 mt-4">絵本グッズの企画・製造・流通・販売を扱う関連会社です。</p>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="space-y-8">
                <div>
                  <img src="https://public.readdy.ai/ai/img_res/8cb9be02-af42-4511-97b7-17f5cb2a92e4.png" alt="ライブエンタープライズ" className="h-48 mb-6" />
                  <h3 className="text-xl font-bold mb-4">株式会社ライブエンタープライズ</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="w-24 font-medium text-gray-700">URL</div>
                        <div className="flex-1">
                          <a href="https://liveenterprise.jp/" className="text-primary hover:underline" target="_blank">https://liveenterprise.jp/</a>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-24 font-medium text-gray-700">所在地</div>
                        <div className="flex-1 text-gray-600">〒167-0034 東京都杉並区桃井1-39-1 キャロット杉並 4階</div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-24 font-medium text-gray-700">設立</div>
                        <div className="flex-1 text-gray-600">2015年6月</div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-24 font-medium text-gray-700">資本金</div>
                        <div className="flex-1 text-gray-600">2,000万円</div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="w-24 font-medium text-gray-700">代表者</div>
                        <div className="flex-1 text-gray-600">代表取締役 藤井周</div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-24 font-medium text-gray-700">従業員数</div>
                        <div className="flex-1 text-gray-600">45名</div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-24 font-medium text-gray-700">問い合わせ</div>
                        <div className="flex-1">
                          <a href="mailto:info@liveenterprise.co.jp" className="text-primary hover:underline">info@liveenterprise.co.jp</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 事業内容 */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <h3 className="text-xl font-bold mb-8">事業内容</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white rounded-xl p-6">
                      <h4 className="font-bold text-lg mb-3 flex items-center">
                        <div className="w-6 h-6 flex items-center justify-center mr-2">
                          <i className="ri-store-2-line text-primary"></i>
                        </div>
                        絵本グッズの卸売
                      </h4>
                      <p className="text-gray-600">絵本にまつわるグッズの卸販売を行っています。全国約1,400店舗の書店や雑貨店にて展開中の「えほんやさんMOE」では、売場づくりから商品提供まで、幅広くサポートしています。</p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-6">
                      <h4 className="font-bold text-lg mb-3 flex items-center">
                        <div className="w-6 h-6 flex items-center justify-center mr-2">
                          <i className="ri-shopping-cart-line text-primary"></i>
                        </div>
                        オンラインショップ
                      </h4>
                      <p className="text-gray-600">絵本とそのまわりのたのしみを、ご自宅へお届けしています。オンラインストアでは、選りすぐりの絵本やグッズを取りそろえ、読み手の日常に寄り添うお買いもの体験をご用意しています。</p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-6">
                      <h4 className="font-bold text-lg mb-3 flex items-center">
                        <div className="w-6 h-6 flex items-center justify-center mr-2">
                          <i className="ri-newspaper-line text-primary"></i>
                        </div>
                        メディア掲載・業務提携
                      </h4>
                      <p className="text-gray-600">絵本や子育てにまつわる情報発信、広告・メディア掲載のほか、スポンサーシップや各種タイアップなど、多様な形でのパートナーシップをひらいています。</p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-6">
                      <h4 className="font-bold text-lg mb-3 flex items-center">
                        <div className="w-6 h-6 flex items-center justify-center mr-2">
                          <i className="ri-book-open-line text-primary"></i>
                        </div>
                        絵本事業支援
                      </h4>
                      <p className="text-gray-600">作家さんや出版社、取次、書店の方々といっしょに、垣根をこえた企画やイベントをかたちにしています。絵本をとりまく仕事と文化の広がりを、長く、ていねいに支えていく取り組みです。</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NPO協賛セクション */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-full md:w-1/3 space-y-6">
                  <img src={withBase('images/readdy/c232cd79367bc15cb28731bbf46aac12.png')} alt="NPO法人 絵本文化推進協会" className="w-full object-contain" />
                  <img src={withBase('images/readdy/e7ac9ac820c2da1855d55e8c20182804.webp')} alt="絵本の日" className="w-full object-contain" />
                </div>
                <div className="w-full md:w-2/3">
                  <h2 className="text-xl font-bold mb-6">NPO法人 絵本文化推進協会の協賛企業です</h2>
                  <p className="text-gray-600 mb-6">NPO法人 絵本文化推進協会の協賛企業として、絵本文化の普及と発展を応援しています。</p>
                  <p className="text-gray-600 mb-6">この協会は、絵本専門士や絵本作家などの講師派遣や、絵本を贈る運動、地域社会との連携を通じて、絵本文化と読書活動の推進に取り組んでいます。</p>
                  <p className="text-gray-600 mb-6">私たちもその一員として、絵本を通じた豊かな文化づくりに参加しています。</p>
                  <div className="flex items-center">
                    <a href="https://ehon-bunka.org/" target="_blank" className="group inline-flex items-center text-primary hover:text-primary/80 transition-colors">
                      <span>詳しくは、絵本文化推進協会の公式サイトをご覧ください</span>
                      <div className="w-5 h-5 flex items-center justify-center ml-1 group-hover:translate-x-0.5 transition-transform">
                        <i className="ri-arrow-right-line"></i>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* アクセスマップセクション */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold mb-12 text-center">アクセス</h2>
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-50 rounded-2xl p-6 md:p-8 shadow-sm">
              <div className="mb-8 h-80 rounded-xl overflow-hidden relative">
                <a href="https://maps.app.goo.gl/Fofs86Hpxmz4wpYEA" target="_blank" className="block w-full h-full relative group">
                  <div className="absolute inset-0 bg-center bg-cover" style={{backgroundImage: "url('https://public.readdy.ai/gen_page/map_placeholder_1280x720.png')"}}></div>
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <div className="absolute bottom-4 right-4 bg-white rounded-full p-3 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-6 h-6 flex items-center justify-center text-primary">
                      <i className="ri-map-2-line"></i>
                    </div>
                  </div>
                </a>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold mb-4">株式会社親子の時間研究所</h3>
                  <div className="space-y-3 text-gray-600">
                    <p>〒560-0021</p>
                    <p>大阪府豊中市上野坂２丁目３−３ エルベラーノ4F</p>
                    <div className="mt-6">
                      <h4 className="font-bold mb-2">交通アクセス</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>阪急宝塚線「豊中駅」より車で7分</li>
                        <li>大阪モノレール「少路駅」より徒歩8分</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-4">カルチャー＆ブックカフェPICO</h3>
                  <div className="space-y-3 text-gray-600">
                    <p>〒560-0012</p>
                    <p>大阪府豊中市上野坂２丁目３−３ エルベラーノ1F</p>
                    <p className="mt-4">TEL: 06-7654-7069</p>
                    <div className="mt-6">
                      <h4 className="font-bold mb-2">営業時間（季節、時期によって異なります）</h4>
                      <a href="https://maps.app.goo.gl/Fofs86Hpxmz4wpYEA" target="_blank" className="group inline-flex items-center text-primary hover:text-primary/80 transition-colors">
                        <span>営業時間はこちらからご確認ください</span>
                        <div className="w-5 h-5 flex items-center justify-center ml-1 group-hover:translate-x-0.5 transition-transform">
                          <i className="ri-arrow-right-line"></i>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AboutPage;
