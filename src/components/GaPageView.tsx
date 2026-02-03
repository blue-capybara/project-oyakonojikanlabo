import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { sendPageView } from '../lib/ga';

// ルート遷移時に page_view を送信するだけの薄いコンポーネント。
// gtag が初期化されていない環境（ステージなど）では sendPageView が即 return する。
const GaPageView: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    sendPageView(path);
  }, [location.pathname, location.search]);

  return null;
};

export default GaPageView;
