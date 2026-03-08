import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { normalizePathname } from '../../utils/seo';

/**
 * 最小限の URL 正規化
 * - 末尾スラッシュ（ルート以外）を除去
 * - 連続スラッシュを 1 つに圧縮
 */
const NormalizeUrl: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const normalizedPath = normalizePathname(location.pathname);
    if (normalizedPath === location.pathname) return;

    navigate(`${normalizedPath}${location.search}${location.hash}`, { replace: true });
  }, [location.pathname, location.search, location.hash, navigate]);

  return null;
};

export default NormalizeUrl;
