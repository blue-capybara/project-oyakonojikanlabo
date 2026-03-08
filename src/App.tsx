import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { GA4_B_LINKER_DOMAINS, initGa4B } from './analytics/ga4b';
import { useGa4BPageView } from './analytics/useGa4BPageView';
import Seo from './components/seo/Seo';
import NormalizeUrl from './components/seo/NormalizeUrl';
import ScrollToTop from './components/ScrollToTop';
import GaPageView from './components/GaPageView';
import HomePage from './pages/HomePage';
import { getFeatureFlag } from './config/featureFlags';
import { shouldNoIndex } from './utils/seo';
import { STATIC_WP_ROUTES } from './routes/staticWpRoutes';
import './index.css';

const PostDetailPage = lazy(() => import('./pages/PostDetailPage'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const EventReservationPage = lazy(() => import('./pages/EventReservationPage'));
const ArchivePage = lazy(() => import('./pages/ArchivePage'));
const EventArchivePage = lazy(() => import('./pages/EventArchivePage'));
const TagArchivePage = lazy(() => import('./pages/TagArchivePage'));
const PicoPage = lazy(() => import('./pages/PicoPage'));
const CultureSchoolPage = lazy(() => import('./pages/CultureSchoolPage'));
const PreviewPage = lazy(() => import('./pages/PreviewPage'));
const SchoolDetailPage = lazy(() => import('./pages/SchoolDetailPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ContactPicoPage = lazy(() => import('./pages/ContactPicoPage'));
const MyPage = lazy(() => import('./pages/MyPage'));
const Signup = lazy(() => import('./pages/Signup'));
const Login = lazy(() => import('./pages/Login'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const AdminReservationsPage = lazy(() => import('./pages/AdminReservationsPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const NotationBasedPage = lazy(() => import('./pages/NotationBasedPage'));
const StaticWpPage = lazy(() => import('./pages/StaticWpPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const Ga4BPageView = ({ domains }: { domains: string[] }) => {
  useGa4BPageView({ linkerDomains: domains });
  return null;
};

const TagArchiveRedirect = () => {
  const { slug } = useParams<{ slug: string }>();
  const target = slug ? `/tag/${slug}` : '/tag';
  return <Navigate to={target} replace />;
};

function App() {
  const showMembershipFeatures = getFeatureFlag('showMembershipFeatures');
  const globalNoindex = shouldNoIndex();

  useEffect(() => {
    initGa4B(GA4_B_LINKER_DOMAINS);
  }, []);

  return (
    <Router>
      {globalNoindex && <Seo noindex />}
      <NormalizeUrl />
      <ScrollToTop />
      <GaPageView />
      <Ga4BPageView domains={GA4_B_LINKER_DOMAINS} />
      <div className="App">
        <Suspense fallback={null}>
          <Routes>
            {/* 固定ページ・一覧系（静的プレフィックスは記事スラッグより優先的にマッチさせる） */}
            <Route path="/" element={<HomePage />} />
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="/event" element={<EventArchivePage />} />
            <Route path="/tag/:slug" element={<TagArchivePage />} />
            <Route path="/tags/:slug" element={<TagArchiveRedirect />} />
            <Route path="/pico" element={<PicoPage />} />
            <Route path="/culture-school" element={<CultureSchoolPage />} />
            <Route path="/school-detail/:id" element={<SchoolDetailPage />} />
            <Route path="/preview" element={<PreviewPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            {/* PICO専用の問い合わせ窓口（通知先の分岐は send-mail 側で行う想定） */}
            <Route path="/contact-pico" element={<ContactPicoPage />} />
            <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/notationbased" element={<NotationBasedPage />} />
            <Route path="/contact-us" element={<Navigate to="/contact" replace />} />
            <Route path="/company-profile" element={<Navigate to="/about" replace />} />
            {STATIC_WP_ROUTES.map(({ path, ...pageProps }) => (
              <Route key={path} path={path} element={<StaticWpPage {...pageProps} />} />
            ))}
            <Route
              path="/mypage"
              element={showMembershipFeatures ? <MyPage /> : <Navigate to="/" replace />}
            />
            <Route
              path="/signup"
              element={showMembershipFeatures ? <Signup /> : <Navigate to="/" replace />}
            />
            <Route
              path="/login"
              element={showMembershipFeatures ? <Login /> : <Navigate to="/" replace />}
            />
            <Route path="/admin/reservations" element={<AdminReservationsPage />} />
            <Route path="/search" element={<SearchPage />} />
            {/* CPT: event は /event/{slug} を保持。予約ページ→詳細の順で明示し、/event 配下を優先させる */}
            <Route path="/event/:slug/reserve" element={<EventReservationPage />} />
            <Route path="/event/:slug" element={<EventDetailPage />} />
            {/* WordPress post はプレフィックス無しのスラッグ。SEO的に正規URLとし、衝突回避のため最後にマッチさせる */}
            <Route path="/:slug" element={<PostDetailPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
