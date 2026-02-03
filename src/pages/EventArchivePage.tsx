import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { gql, request } from 'graphql-request';
import Layout from '../components/Layout/Layout';
import Breadcrumb from '../components/Breadcrumb';
import { getFeatureFlag } from '../config/featureFlags';
import { withBase } from '../utils/paths';

interface EventSlot {
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

interface EventCpt {
  summary?: string | null;
  eventType?: string | null;
  price?: number | null;
  priceType?: string | null;
  reservationOpen?: boolean | null;
  mainImage?: {
    node?: {
      sourceUrl?: string | null;
    } | null;
  } | null;
  singleSlots?: EventSlot[] | null;
  venueRef?: {
    nodes?: Array<{
      __typename?: string | null;
      title?: string | null;
      slug?: string | null;
    }> | null;
  } | null;
  venueMapsUrl?: string | null;
}

interface EventNode {
  id: string;
  slug?: string | null;
  title?: string | null;
  eventCpt?: EventCpt | null;
  eventRegions?: {
    nodes?: Array<{
      name?: string | null;
      slug?: string | null;
      parent?: {
        node?: {
          name?: string | null;
          slug?: string | null;
        } | null;
      } | null;
    }> | null;
  } | null;
  eventCategories?: {
    nodes?: Array<{
      name?: string | null;
      slug?: string | null;
    }> | null;
  } | null;
}

interface EventsResponse {
  events?: {
    nodes?: EventNode[] | null;
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  } | null;
}

interface Event {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  location: string;
  region: string;
  regionDisplay: string;
  regionName: string;
  image: string;
  status: 'current' | 'upcoming' | 'past';
}

const endpoint = 'https://cms.oyakonojikanlabo.jp/graphql';

const GET_EVENTS = gql`
  query GetEventArchive($first: Int!, $after: String) {
    events(first: $first, after: $after, where: { orderby: { field: DATE, order: DESC } }) {
      pageInfo {
        endCursor
        hasNextPage
      }
      nodes {
        id
        slug
        title
        eventCpt {
          eventType
          summary
          reservationOpen
          mainImage {
            node {
              sourceUrl
            }
          }
          singleSlots {
            date
            startTime
            endTime
          }
          venueRef {
            nodes {
              __typename
              ... on Space {
                title
                slug
              }
              ... on Page {
                title
              }
              ... on Post {
                title
              }
            }
          }
        }
        eventCategories {
          nodes {
            name
            slug
          }
        }
        eventRegions {
          nodes {
            name
            slug
            parent {
              node {
                name
                slug
              }
            }
          }
        }
      }
    }
  }
`;

const REGION_SLUG_MAP: Record<string, string> = {
  北海道: 'hokkaido',
  東北: 'tohoku',
  関東: 'kanto',
  中部: 'chubu',
  近畿: 'kinki',
  大阪府: 'kinki',
  中国: 'chugoku',
  四国: 'shikoku',
  九州: 'kyushu',
  '九州・沖縄': 'kyushu',
};

const REGION_SLUG_NORMALIZE: Record<string, string> = {
  hokkaido: 'hokkaido',
  tohoku: 'tohoku',
  kanto: 'kanto',
  chubu: 'chubu',
  chubu_region: 'chubu',
  kinki: 'kinki',
  kansai: 'kinki',
  '05-kinki': 'kinki',
  chugoku: 'chugoku',
  shikoku: 'shikoku',
  kyushu: 'kyushu',
  kyushu_okinawa: 'kyushu',
  'kyushu-okinawa': 'kyushu',
};

const normalizeRegionSlug = (slug?: string | null) => {
  if (!slug) return undefined;
  if (REGION_SLUG_NORMALIZE[slug]) return REGION_SLUG_NORMALIZE[slug];
  const trimmed = slug.replace(/^\d+-/, '');
  if (REGION_SLUG_NORMALIZE[trimmed]) return REGION_SLUG_NORMALIZE[trimmed];
  return slug;
};

const CATEGORY_META: Record<string, { label: string; className: string }> = {
  'event-pico': { label: 'PICOイベント', className: 'bg-orange-100 text-orange-800' },
  author: { label: '作家イベント', className: 'bg-red-100 text-red-800' },
  exhibition: { label: '原画展', className: 'bg-blue-100 text-blue-800' },
  workshop: { label: 'ワークショップ', className: 'bg-green-100 text-green-800' },
  event: { label: 'イベント', className: 'bg-purple-100 text-purple-800' },
  other: { label: 'その他', className: 'bg-gray-100 text-gray-800' },
};

const selectPrimarySlot = (slots?: EventSlot[] | null) => {
  if (!slots || slots.length === 0) return undefined;
  return slots.find((slot) => slot.date) ?? slots[0];
};

const formatSchedule = (slot?: EventSlot) => {
  if (!slot) return '日程未定';

  const { date, startTime, endTime } = slot;
  let dateLabel = date ?? '';

  if (date) {
    const parsed = new Date(date);
    if (!Number.isNaN(parsed.getTime())) {
      dateLabel = parsed.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      });
    }
  }

  const normalizeTime = (time?: string | null) => {
    if (!time) return '';
    if (time.length >= 5) {
      return time.slice(0, 5);
    }
    return time;
  };

  const startLabel = normalizeTime(startTime);
  const endLabel = normalizeTime(endTime);

  const timeLabel = startLabel
    ? `${startLabel}${endLabel ? `〜${endLabel}` : ''}`
    : endLabel;

  return [dateLabel, timeLabel].filter(Boolean).join(' ');
};

const combineDateTime = (date?: string | null, time?: string | null) => {
  if (!date) return null;
  const normalizedTime = time ? (time.length === 5 ? `${time}:00` : time) : '00:00:00';
  return new Date(`${date}T${normalizedTime}`);
};

const determineStatus = (slot?: EventSlot): Event['status'] => {
  const now = new Date();
  if (!slot?.date) {
    return 'upcoming';
  }

  const start = combineDateTime(slot.date, slot.startTime);
  const end = combineDateTime(slot.date, slot.endTime);

  if (start && !Number.isNaN(start.getTime())) {
    if (end && !Number.isNaN(end.getTime())) {
      if (now >= start && now <= end) return 'current';
      return now < start ? 'upcoming' : 'past';
    }

    if (start.toDateString() === now.toDateString()) return 'current';
    return now < start ? 'upcoming' : 'past';
  }

  return 'upcoming';
};

const buildLocationLabel = (
  eventCpt?: EventCpt | null,
  regions?: EventNode['eventRegions'],
) => {
  const venueNames = eventCpt?.venueRef?.nodes
    ?.map((node) => node?.title)
    .filter((title): title is string => Boolean(title));

  if (venueNames && venueNames.length > 0) {
    return venueNames.join('・');
  }

  const sortedRegions = regions?.nodes
    ?.slice()
    .sort((a, b) => {
      const aSlug = a?.slug ?? '';
      const bSlug = b?.slug ?? '';
      const aIsPref = /\d{4}/.test(aSlug);
      const bIsPref = /\d{4}/.test(bSlug);
      if (aIsPref && !bIsPref) return -1;
      if (!aIsPref && bIsPref) return 1;
      return 0;
    });

  const regionNames = sortedRegions
    ?.map((node) => node?.name)
    .filter((name): name is string => Boolean(name));

  if (regionNames && regionNames.length > 0) {
    return regionNames.join('・');
  }

  return '開催地未定';
};

const deriveRegionInfo = (regions?: EventNode['eventRegions']) => {
  const nodes = regions?.nodes?.filter((node): node is NonNullable<typeof node> => Boolean(node)) ?? [];

  const childNode = nodes.find((node) => node.parent?.node?.slug);
  const topNode = childNode?.parent?.node ?? nodes.find((node) => !node.parent?.node?.slug) ?? childNode ?? nodes[0];

  const topSlug = normalizeRegionSlug(topNode?.slug) ?? (topNode?.name && REGION_SLUG_MAP[topNode.name]) ?? 'other';
  const topName = topNode?.name ?? REGION_SLUG_MAP[topNode?.slug ?? ''] ?? 'その他';

  const displayNode = childNode ?? nodes.find((node) => node.parent?.node?.slug) ?? nodes[0];
  const displayName = displayNode?.name ?? '地域未定';

  if (topSlug === 'other' && displayNode?.name && REGION_SLUG_MAP[displayNode.name]) {
    return {
      regionSlug: REGION_SLUG_MAP[displayNode.name],
      regionName: displayNode.name,
      regionDisplay: displayName,
    };
  }

  return {
    regionSlug: topSlug,
    regionName: topName,
    regionDisplay: displayName,
  };
};

const resolveCategory = (categoryNodes?: EventNode['eventCategories']) => {
  const slug = categoryNodes?.nodes?.find((node) => node?.slug)?.slug;
  if (!slug) return 'other';
  return slug;
};

const FALLBACK_EVENTS: Event[] = [
  {
    id: 'fallback-1',
    slug: 'sample-event-1',
    title: '山田ゆうこさん 絵本読み聞かせ会',
    category: 'author',
    date: '2025年6月20日(金) 14:00〜15:30',
    location: '丸の内ブックセンター',
    region: 'kanto',
    regionDisplay: '東京都',
    regionName: '関東',
    image: withBase('images/readdy/bf36d3a66d2c4495d815daab6a95c131.png'),
    status: 'current',
  },
  {
    id: 'fallback-2',
    slug: 'sample-event-2',
    title: '「動物たちの世界」絵本原画展',
    category: 'exhibition',
    date: '2025年7月1日(火)〜7月15日(火)',
    location: '大阪市立美術館',
    region: 'kinki',
    regionDisplay: '大阪府',
    regionName: '近畿',
    image:
      withBase('images/readdy/seq9-landscape-an-art-exhibition-featuring-childrens-book.jpg'),
    status: 'upcoming',
  },
  {
    id: 'fallback-3',
    slug: 'sample-event-3',
    title: 'たなかしん作品展【守りたいもの】',
    category: 'author',
    date: '2025年05月30日 〜 07月13日',
    location: 'PICO豊中',
    region: 'kinki',
    regionDisplay: '大阪府',
    regionName: '近畿',
    image: withBase('images/readdy/30e5f268453d5644679393e8b3b473c7.jpeg'),
    status: 'current',
  },
];

const EventArchivePage: React.FC = () => {
  const showMembershipFeatures = getFeatureFlag('showMembershipFeatures');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const pageInfoRef = useRef<{ hasNextPage: boolean; endCursor: string | null }>({
    hasNextPage: true,
    endCursor: null,
  });

  const fetchEvents = useCallback(
    async ({ append }: { append?: boolean } = {}) => {
      const isAppend = append ?? false;

      if (isAppend) {
        if (!pageInfoRef.current.hasNextPage) return;
        setIsLoadingMore(true);
      } else {
        setLoading(true);
        setEvents([]);
        pageInfoRef.current = { hasNextPage: true, endCursor: null };
      }

      setError(null);

      try {
        const data = await request<EventsResponse>(endpoint, GET_EVENTS, {
          first: isAppend ? 9 : 12,
          after: isAppend ? pageInfoRef.current.endCursor : null,
        });

        const nodes = data.events?.nodes ?? [];

        const formatted: Event[] = nodes
          .filter((node): node is EventNode & { slug: string; title: string } => Boolean(node.slug && node.title))
          .map((node) => {
            const eventCpt = node.eventCpt ?? {};
            const primarySlot = selectPrimarySlot(eventCpt.singleSlots);
            const categorySlug = resolveCategory(node.eventCategories);
            const regionInfo = deriveRegionInfo(node.eventRegions);

            return {
              id: node.id,
              slug: node.slug ?? node.id,
              title: node.title ?? 'イベント情報',
              category: categorySlug,
              date: formatSchedule(primarySlot),
              location: buildLocationLabel(eventCpt, node.eventRegions),
              region: regionInfo.regionSlug,
              regionDisplay: regionInfo.regionDisplay,
              regionName: regionInfo.regionName,
              image: eventCpt.mainImage?.node?.sourceUrl ?? '/default.jpg',
              status: determineStatus(primarySlot),
            };
          });

        setEvents((prev) => (isAppend ? [...prev, ...formatted] : formatted));
        pageInfoRef.current = {
          hasNextPage: Boolean(data.events?.pageInfo.hasNextPage),
          endCursor: data.events?.pageInfo.endCursor ?? null,
        };

        if (!isAppend && formatted.length === 0) {
          setEvents(FALLBACK_EVENTS);
          pageInfoRef.current = { hasNextPage: false, endCursor: null };
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
        setEvents((prev) => (prev.length > 0 ? prev : FALLBACK_EVENTS));
        if (!isAppend) {
          pageInfoRef.current = { hasNextPage: false, endCursor: null };
        }
      } finally {
        if (isAppend) {
          setIsLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    fetchEvents({ append: false });
  }, [fetchEvents]);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(events.map((event) => event.category).filter((category) => category && category !== 'all')),
    );

    const options = unique.map((categoryId) => ({
      id: categoryId,
      label: CATEGORY_META[categoryId]?.label ?? CATEGORY_META.other.label,
    }));

    if (events.some((event) => event.category === 'other')) {
      options.push({ id: 'other', label: CATEGORY_META.other.label });
    }

    return [{ id: 'all', label: 'すべて' }, ...options];
  }, [events]);

  const regions = useMemo(() => {
    const map = new Map<string, string>();
    events.forEach((event) => {
      if (!event.region) return;
      if (!map.has(event.region)) {
        map.set(event.region, event.regionName || event.regionDisplay || event.region);
      }
    });

    const options = Array.from(map.entries())
      .filter(([id]) => id !== 'all')
      .map(([id, label]) => ({ id, label }));

    options.sort((a, b) => a.label.localeCompare(b.label, 'ja'));

    return [{ id: 'all', label: 'すべての地域' }, ...options];
  }, [events]);

  const filteredEvents = events.filter(event => {
    const categoryMatch = selectedCategory === 'all' || event.category === selectedCategory;
    const regionMatch = selectedRegion === 'all' || event.region === selectedRegion;
    const periodMatch = selectedPeriod === 'all' || event.status === selectedPeriod;
    return categoryMatch && regionMatch && periodMatch;
  });

  const getCategoryStyle = (category: string) => CATEGORY_META[category]?.className ?? CATEGORY_META.other.className;

  const getCategoryLabel = (category: string) => CATEGORY_META[category]?.label ?? CATEGORY_META.other.label;

  return (
    <Layout>
      <Breadcrumb
        items={[
          { label: 'ホーム', to: '/' },
          { label: 'イベント一覧' },
        ]}
      />
      <div className="container mx-auto px-4">

        {/* ページヘッダー */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-3xl font-bold">イベント一覧</h1>
          <Link to="/" className="flex items-center text-primary hover:text-primary/80 mt-2 md:mt-0">
            <i className="ri-arrow-left-line mr-1"></i>
            元のページに戻る
          </Link>
        </div>

        {/* フィルターセクション */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* カテゴリーフィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリー</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 text-sm rounded-full transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-primary hover:text-white'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 地域フィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">開催地域</label>
              <div className="relative">
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg appearance-none bg-white pr-10 focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  {regions.map(region => (
                    <option key={region.id} value={region.id}>{region.label}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <i className="ri-arrow-down-s-line text-gray-400"></i>
                </div>
              </div>
            </div>

            {/* 期間フィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">開催期間</label>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="period"
                    value="all"
                    checked={selectedPeriod === 'all'}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="ml-2 text-sm">すべて</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="period"
                    value="current"
                    checked={selectedPeriod === 'current'}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="ml-2 text-sm">開催中</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="period"
                    value="upcoming"
                    checked={selectedPeriod === 'upcoming'}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="ml-2 text-sm">開催予定</span>
                </label>
              </div>
            </div>
          </div>

          {/* 検索結果表示 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <p className="text-gray-600">
                <span className="font-medium">{filteredEvents.length}</span>件のイベントが見つかりました
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">並び替え:</span>
                <div className="relative">
                  <select className="px-4 py-1 text-sm border rounded-lg appearance-none bg-white pr-8">
                    <option value="date-asc">開催日（近い順）</option>
                    <option value="date-desc">開催日（遠い順）</option>
                    <option value="new">新着順</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <i className="ri-arrow-down-s-line text-gray-400"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ローディング表示 */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <span className="ml-3 text-gray-600">読み込み中...</span>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <i className="ri-error-warning-line text-red-500 mr-2"></i>
              <p className="text-red-700">
                データの取得中にエラーが発生しました: {error}
              </p>
            </div>
            <p className="text-red-600 text-sm mt-2">
              サンプルデータを表示しています。
            </p>
          </div>
        )}

        {/* イベント一覧 */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map(event => (
              <div
                key={event.id}
                className="relative group bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:-translate-y-1"
              >
                <Link
                  to={`/event/${event.slug}`}
                  className="absolute inset-0 z-10"
                  aria-label={`${event.title}の詳細へ`}
                />
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-48 object-cover object-top"
                />
                <div className="relative z-20 p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className={`inline-block px-3 py-1 text-xs rounded-full ${getCategoryStyle(event.category)}`}>
                    {getCategoryLabel(event.category)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">{event.regionDisplay}</span>
                    {showMembershipFeatures && (
                      <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                        <i className="ri-heart-line"></i>
                      </button>
                    )}
                  </div>
                </div>
                  <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                  <div className="flex items-center text-gray-600 mb-2">
                    <div className="w-5 h-5 flex items-center justify-center mr-2">
                      <i className="ri-calendar-line"></i>
                    </div>
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center text-gray-600 mb-4">
                    <div className="w-5 h-5 flex items-center justify-center mr-2">
                      <i className="ri-map-pin-line"></i>
                    </div>
                    <span>{event.location}</span>
                  </div>
                  <Link
                    to={`/event/${event.slug}`}
                    className="relative z-30 block w-full bg-primary text-white py-2 font-medium rounded-button whitespace-nowrap hover:bg-primary/90 transition-colors text-center"
                  >
                    イベント詳細
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* データが0件の場合 */}
        {!loading && !error && filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <i className="ri-calendar-line text-gray-300 text-6xl mb-4"></i>
            <p className="text-gray-500 text-lg">該当するイベントが見つかりませんでした。</p>
          </div>
        )}

        {/* ページネーション */}
        {pageInfoRef.current.hasNextPage && !loading && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={() => fetchEvents({ append: true })}
              className="px-6 py-3 bg-primary text-white rounded-button font-medium hover:bg-primary/90 transition-colors"
              disabled={isLoadingMore}
            >
              {isLoadingMore ? '読み込み中...' : 'もっと見る'}
            </button>
          </div>
        )}
      </div>

      {/* メール通知セクション */}
      <section className="hidden bg-gray-50 py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 mb-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">絵本イベントの情報を、メールでお届けします。</h2>
              <div className="text-gray-600 leading-relaxed text-base max-w-2xl mx-auto space-y-4">
                <p>
                  ご登録いただいた地域にあわせて、近くで開催されるイベントや、<br />
                  ちょっといいなと思うカルチャーの話などを、<br />
                  ニュースレターでお届けしようと思っています。もちろん無料です。
                </p>
                <p>
                  「行ってみたい」「気になる」<br />
                  そんなきっかけになればと思っています。
                </p>
                <p>ご関心のある方は、ぜひご登録ください。</p>
              </div>
            </div>
            <div className="max-w-2xl mx-auto">
              <form className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-8 gap-3">
                  <div className="relative sm:col-span-3">
                    <select className="w-full px-4 py-3 border border-gray-200 rounded-lg appearance-none bg-white focus:border-primary focus:ring-1 focus:ring-primary text-sm pr-10">
                      <option value="">お住まいの地域を選択</option>
                      <option value="hokkaido">北海道</option>
                      <option value="tohoku">東北</option>
                      <option value="kanto">関東</option>
                      <option value="chubu">中部</option>
                      <option value="kinki">近畿</option>
                      <option value="chugoku">中国</option>
                      <option value="shikoku">四国</option>
                      <option value="kyushu">九州・沖縄</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <i className="ri-arrow-down-s-line text-gray-400"></i>
                    </div>
                  </div>
                  <input
                    type="email"
                    placeholder="メールアドレスをご入力"
                    className="sm:col-span-3 px-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                  />
                  <button
                    type="submit"
                    className="sm:col-span-2 bg-[#FF9F67] text-white px-6 py-3 rounded-button hover:bg-[#FF9F67]/90 transition-colors whitespace-nowrap font-medium"
                  >
                    登録する
                  </button>
                </div>
              </form>
              <p className="text-xs text-gray-500 text-center mt-4">
                ※イベントメールの解除は届いたメールから「メール解除」でできます
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default EventArchivePage;
