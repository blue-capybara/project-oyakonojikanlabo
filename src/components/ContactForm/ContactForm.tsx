import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, supabaseAnonKey, supabaseUrl } from '../../lib/supabaseClient';
import { sendContactSubmitEvent } from '../../lib/ga';

interface FileUpload {
  file: File;
  preview: string;
}

interface InquiryType {
  value: string;
  label: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface ContactFormProps {
  defaultInquiryType?: string;
  inquiryTypes?: InquiryType[];
  faqs?: FaqItem[];
  showFaq?: boolean;
}

// value は管理通知メールの宛先を振り分けるキーとして利用する前提です。
// 変更・追加する場合は Supabase Functions（send-mail 側）の宛先マッピングも更新してください。
const DEFAULT_INQUIRY_TYPES: InquiryType[] = [
  { value: 'book_art_event', label: '絵本アート系イベントを掲載したい' },
  { value: 'product', label: '商品のことを聞きたい' },
  { value: 'product_defect', label: '商品の不良について' },
  { value: 'wholesale', label: '卸売りについて' },
  { value: 'pico', label: 'PICO豊中について' },
  { value: 'media', label: '取材、メディア関係のご相談' },
  { value: 'other', label: 'その他ご相談' }
];

const DEFAULT_FAQS: FaqItem[] = [
  {
    question: '絵本アート系イベントの掲載について教えてください',
    answer: '現在、このサービスはまだ開始しておりません。ですが、「うちのイベントを紹介してもいいよ」「気になっている」というお声が集まれば、本格的にスタートする予定です。絵本専門店の方や絵本カフェの運営者の方などにも、無理のない形でご参加いただければうれしく思います。掲載は無料の予定です。イベントの規模やジャンルも問いません。今後、よりスムーズに情報掲載ができるよう、双方にとってやりやすい仕組みを模索してまいります。ご興味をお持ちの方は、ぜひご連絡ください。こちらから折り返しご連絡のうえ、ご相談させていただきます。'
  },
  {
    question: '絵本の靴下はどこで購入できますか？',
    answer: '「絵本のくつした」は、オンラインショップ「親子の時間研究所」、直営店「PICO豊中」、そして全国のお取り扱い書店でご購入いただけます。ときどき、期間限定のポップアップショップにも登場します。最新の販売情報は、SNSでもおしらせしていますので、よかったら、そちらもチェックしてみてくださいね。'
  },
  {
    question: '商品に不具合があった場合',
    answer: 'ご迷惑をおかけして申し訳ございません。お問い合わせフォームにて、種別「商品の不良について」を選択し、以下の情報をご記入ください。・商品名・ご購入日・不具合の内容　不具合の状況がわかる写真も添付していただけますと、より迅速な対応が可能です。'
  },
  {
    question: '取材や撮影の依頼はどのように行えばよいですか？',
    answer: '取材や撮影をご希望の際は、お問い合わせフォームで「取材、メディア関係のご相談」を選び、以下の情報をご記入ください。・媒体名・取材・撮影の内容・ご希望の日時・ご連絡先　企画書や参考資料などがございましたら、画像添付機能にてあわせてご提出ください。'
  },
  {
    question: '画像添付機能の使い方を教えてください',
    answer: '画像を添付する場合は、該当のエリアにファイルをドラッグ＆ドロップするか、クリックしてファイルを選択してください。対応形式：JPG、PNG、GIF　アップロード可能数：最大5枚　合計ファイルサイズ：最大5MBまで　アップロード後にはプレビューが表示されます。不要な画像はその場で削除することも可能です。'
  },
  {
    question: '絵本作家や出版社とのコラボレーションは可能ですか？',
    answer: 'ご相談ください。親子の時間研究所では、絵本作家さんや出版社さんと、イベントや商品づくり、コンテンツ制作など、いろいろな形でご一緒しています。「こんなことできるかな？」というご相談も、大歓迎です。お問い合わせフォームから、またはメールにてお気軽にご連絡くださいね。'
  }
];

const ContactForm: React.FC<ContactFormProps> = ({
  defaultInquiryType = '',
  inquiryTypes = DEFAULT_INQUIRY_TYPES,
  faqs = DEFAULT_FAQS,
  showFaq = true,
}) => {
  const resolvedDefaultInquiryType = useMemo(() => {
    if (!defaultInquiryType) return '';
    return inquiryTypes.some((type) => type.value === defaultInquiryType)
      ? defaultInquiryType
      : '';
  }, [defaultInquiryType, inquiryTypes]);

  const [selectedInquiryType, setSelectedInquiryType] = useState(resolvedDefaultInquiryType);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    // /contact-pico など専用ページから来た場合に初期選択を合わせるために使用します。
    setSelectedInquiryType(resolvedDefaultInquiryType);
  }, [resolvedDefaultInquiryType]);

  const maxTotalSize = 5 * 1024 * 1024; // 5MB
  const maxFiles = 5;

  const handleInquiryTypeSelect = (value: string) => {
    setSelectedInquiryType(value);
    setIsDropdownOpen(false);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

    if (uploadedFiles.length + newFiles.length > maxFiles) {
      showNotification(`最大${maxFiles}枚までアップロードできます`, 'error');
      return;
    }

    const currentTotalSize = uploadedFiles.reduce((sum, item) => sum + item.file.size, 0);
    const newTotalSize = newFiles.reduce((sum, file) => sum + file.size, currentTotalSize);

    if (newTotalSize > maxTotalSize) {
      showNotification('合計ファイルサイズが5MBを超えています', 'error');
      return;
    }

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedFiles(prev => [...prev, {
          file,
          preview: e.target?.result as string
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getTotalSize = () => {
    return uploadedFiles.reduce((sum, item) => sum + item.file.size, 0);
  };

  const getSizePercentage = () => {
    return (getTotalSize() / maxTotalSize) * 100;
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-20 left-1/2 transform -translate-x-1/2 z-50 py-3 px-6 rounded-lg shadow-lg ${
      type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('opacity-0', 'transition-opacity', 'duration-500');
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget; // SyntheticEvent がクリアされても参照を保持する

    const formData = new FormData(form);

    if (!formData.get('name') || !formData.get('email') || !formData.get('phone') ||
        !selectedInquiryType || !formData.get('message') || !formData.get('privacy_policy')) {
      showNotification('必須項目をすべて入力してください。', 'error');
      return;
    }

    const email = formData.get('email') as string;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showNotification('メールアドレスの形式が正しくありません。', 'error');
      return;
    }

    const message = formData.get('message') as string;
    if (message.length > 500) {
      showNotification('メッセージは500文字以内で入力してください。', 'error');
      return;
    }

    formData.set('inquiry_type', selectedInquiryType);

    const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitButton.disabled = true;
    submitButton.textContent = '送信中...';

    // Step1: クライアント側で requestId / uploadBasePath を生成
    const requestId = crypto.randomUUID();
    const today = new Date().toISOString().slice(0, 10);
    const uploadBasePath = `contact-attachments/${today}/${requestId}`;

    try {
      // Step2: Storage へアップロードし、public URL を取得
      const imageUrls: string[] = [];
      for (let i = 0; i < uploadedFiles.length; i++) {
        const { file } = uploadedFiles[i];
        const uploadPath = `${uploadBasePath}/${i + 1}_${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('contact-attachments')
          .upload(uploadPath, file, { contentType: file.type });

        if (uploadError) throw uploadError;

        const { data: publicData, error: publicUrlError } = supabase.storage
          .from('contact-attachments')
          .getPublicUrl(uploadPath);

        if (publicUrlError || !publicData?.publicUrl) {
          throw publicUrlError || new Error('publicUrl not found');
        }

        imageUrls.push(publicData.publicUrl);
      }

      // Step3: send-mail を1回だけ呼び出す（requestId を必ず含める）
      const functionUrl = `${supabaseUrl}/functions/v1/send-mail`;
      const sendResponse = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          requestId,
          name: formData.get('name'),
          email,
          phone: formData.get('phone'),
          // inquiry_type に応じて管理通知メールの宛先を振り分ける運用を想定しています。
          // 宛先の実体は Supabase Functions（send-mail）の環境変数で管理してください。
          inquiry_type: selectedInquiryType,
          message,
          image_urls: imageUrls,
        })
      });

      if (!sendResponse.ok) {
        throw new Error('failed to send mail');
      }

      sendContactSubmitEvent({ inquiry_type: selectedInquiryType });
      showNotification('お問い合わせを受け付けました。担当者からの返信をお待ちください。', 'success');
      form.reset();
      setSelectedInquiryType(resolvedDefaultInquiryType);
      setUploadedFiles([]);
    } catch (error) {
      console.error(error);
      showNotification('送信に失敗しました。時間をおいて再度お試しください。', 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = '送信する';
    }
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <h2 className="text-xl font-bold mb-8">お問い合わせフォーム</h2>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  お名前<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 text-sm"
                  placeholder="山田 花子"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 text-sm"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  電話番号<span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 text-sm"
                  placeholder="090-1234-5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  お問い合わせ種別<span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 text-sm text-left bg-white flex justify-between items-center"
                  >
                    <span className={selectedInquiryType ? 'text-gray-900' : 'text-gray-500'}>
                      {selectedInquiryType ? inquiryTypes.find(type => type.value === selectedInquiryType)?.label : '選択してください'}
                    </span>
                    <div className="w-4 h-4 flex items-center justify-center text-gray-500">
                      <i className="ri-arrow-down-s-line"></i>
                    </div>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 mt-1">
                      <div className="py-2">
                        {inquiryTypes.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => handleInquiryTypeSelect(type.value)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                お問い合わせ内容<span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 text-sm resize-none"
                placeholder="お問い合わせ内容を詳しくご記入ください"
              />
            </div>

            {/* File Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">画像添付（任意）</label>
              <div className="space-y-4">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-blue-50 transition-colors"
                  onClick={() => document.getElementById('fileInput')?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-primary', 'bg-blue-50');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('border-primary', 'bg-blue-50');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-primary', 'bg-blue-50');
                    handleFileUpload(e.dataTransfer.files);
                  }}
                >
                  <div className="w-12 h-12 flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <i className="ri-upload-cloud-2-line ri-2x"></i>
                  </div>
                  <p className="text-gray-600 mb-2">ファイルをドラッグ&ドロップまたはクリックして選択</p>
                  <p className="text-sm text-gray-500">最大5枚まで、合計5MBまで（JPG、PNG、GIF対応）</p>
                  <input
                    type="file"
                    id="fileInput"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                </div>

                <div className="text-sm text-gray-500">
                  使用容量: <span>{(getTotalSize() / (1024 * 1024)).toFixed(2)}MB</span> / 5MB
                </div>

                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${getSizePercentage()}%` }}
                  />
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                    {uploadedFiles.map((item, index) => (
                      <div key={index} className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square">
                        <img src={item.preview} alt="プレビュー" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 bg-black bg-opacity-70 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-opacity-90"
                        >
                          <i className="ri-close-line"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="flex items-start cursor-pointer">
                <input type="checkbox" name="privacy_policy" required className="mt-1 mr-3" />
                <span className="text-sm text-gray-600">
                  <Link to="/privacy" className="text-primary hover:underline">プライバシーポリシー</Link>に同意します<span className="text-red-500 ml-1">*</span>
                </span>
              </label>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-primary text-white py-4 font-medium rounded-button hover:bg-primary/90 transition-colors text-lg"
              >
                送信する
              </button>
            </div>
          </form>
        </div>
      </div>

      {showFaq && (
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-center mb-10">よくある質問</h2>
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex justify-between items-center p-4 bg-white hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="font-medium">{faq.question}</span>
                    <div className="w-6 h-6 flex items-center justify-center text-gray-500 transform transition-transform">
                      <i className={`ri-${activeFaq === index ? 'subtract' : 'add'}-line`}></i>
                    </div>
                  </button>
                  {activeFaq === index && (
                    <div className="p-4 pt-0 bg-white border-t border-gray-100">
                      <p className="text-gray-600 whitespace-pre-line">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContactForm;
